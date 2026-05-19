/**
 * POST /api/orders
 * Endpoint para recibir pedidos desde PaymentsApp.
 * Las órdenes llegan pre-pagadas (status PAID) con dirección de entrega.
 * 
 * Características:
 * - Autenticación via PAYMENTS_API_KEY en header X-API-Key
 * - Idempotencia mediante externalId único
 * - Validación rigurosa de payload, stock y totales
 * - Transacción atómica Prisma para integridad
 * - Manejo de condiciones de carrera
 */

import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { validateApiKey } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateCreateOrderInput } from '@/lib/validation'

const TOTAL_TOLERANCE = 1 // Tolerancia por redondeo de decimales

/**
 * Calcula el total basado en productos y cantidades.
 */
function calculateTotal(items: { productId: string; quantity: number }[], products: any[]): number {
  let total = 0
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId)
    if (product) {
      total += product.price * item.quantity
    }
  }
  return total
}

export async function POST(request: Request) {
  try {
    // 1. Validar autenticación (PaymentsApp)
    if (!validateApiKey(request, process.env.PAYMENTS_API_KEY)) {
      return NextResponse.json(
        { error: 'X-API-Key inválida o faltante' },
        { status: 401 }
      )
    }

    // 2. Parsear y validar JSON
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'JSON inválido en el body' },
        { status: 400 }
      )
    }

    // 3. Validar esquema del payload
    let input
    try {
      input = validateCreateOrderInput(body)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Validación fallida'
      return NextResponse.json({ error: message }, { status: 400 })
    }

      // 4. Búsqueda rápida: ¿la orden ya existe? (idempotencia)
    const existingOrder = await prisma.order.findUnique({
      where: { externalId: input.externalId },
      include: { items: true },
    })

    if (existingOrder) {
      // Idempotencia: devolver orden existente
      return NextResponse.json(
        {
          success: true,
          orderId: existingOrder.id,
          externalId: existingOrder.externalId,
          status: existingOrder.status,
          total: existingOrder.total,
          note: 'Orden ya existía (idempotencia)',
        },
        { status: 200 }
      )
    }

    // 5. Validar que el Vendor existe
    const vendor = await prisma.vendor.findUnique({
      where: { id: input.vendorId },
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor no encontrado' },
        { status: 400 }
      )
    }

    // 6. Obtener todos los productos solicitados (solo no eliminados)
    const productIds = input.items.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: { 
        id: { in: productIds },
        deletedAt: null, // Excluir productos soft-deleted
      },
    })

    // Validar que todos los productos existen y pertenecen al vendor
    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Uno o más productos no encontrados' },
        { status: 400 }
      )
    }

    for (const product of products) {
      if (product.vendorId !== input.vendorId) {
        return NextResponse.json(
          {
            error: `Producto ${product.id} no pertenece a este vendor`,
          },
          { status: 400 }
        )
      }
    }

    // 7. Validar stock disponible
    for (const item of input.items) {
      const product = products.find((p) => p.id === item.productId)!
      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Stock insuficiente para producto ${product.id} (requiere ${item.quantity}, disponibles ${product.stock})`,
          },
          { status: 400 }
        )
      }
    }

    // 8. Validar que el total coincide
    const computedTotal = calculateTotal(input.items, products)
    if (Math.abs(computedTotal - input.total) > TOTAL_TOLERANCE) {
      return NextResponse.json(
        {
          error: `Total incorrecto (esperado ~${computedTotal.toFixed(2)}, recibido ${input.total})`,
        },
        { status: 400 }
      )
    }

    // 9. Transacción atómica: crear Order + OrderItems + decrementar stock
    try {
      const order = await prisma.$transaction(async (tx) => {
        // Crear Order
        const newOrder = await tx.order.create({
          data: {
            externalId: input.externalId,
            vendorId: input.vendorId,
            buyerId: input.buyerId,
            status: 'PAID',
            address: input.address,
            total: computedTotal,
            items: {
              create: input.items.map((item) => {
                const product = products.find((p) => p.id === item.productId)!
                return {
                  productId: product.id,
                  productName: product.name,
                  productPrice: product.price,
                  quantity: item.quantity,
                }
              }),
            },
          },
          include: { items: true },
        })

        // Decrementar stock para cada producto
        for (const item of input.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        }

        return newOrder
      })

      // 10. Invalidar cache
      revalidatePath('/dashboard/orders')
      revalidatePath('/dashboard/overview')
      revalidateTag('orders', 'max')
      revalidateTag('overview', 'max')
      revalidateTag('products', 'max')

      // 11. Respuesta exitosa
      console.log(
        `[Order Created] externalId=${input.externalId}, orderId=${order.id}, vendorId=${input.vendorId}`
      )

      return NextResponse.json(
        {
          success: true,
          orderId: order.id,
          externalId: order.externalId,
          status: order.status,
          total: order.total,
        },
        { status: 201 }
      )
    } catch (transactionError) {
      // Manejar error de violación de UNIQUE en externalId
      const errMsg = (transactionError as any).message || ''
      if (errMsg.includes('Unique constraint failed') || errMsg.includes('unique constraint')) {
        // Otro request concurrente creó la orden con el mismo externalId
        // Esperar y releer
        await new Promise((resolve) => setTimeout(resolve, 100))
        const raceOrder = await prisma.order.findUnique({
          where: { externalId: input.externalId },
          include: { items: true },
        })

        if (raceOrder) {
          return NextResponse.json(
            {
              success: true,
              orderId: raceOrder.id,
              externalId: raceOrder.externalId,
              status: raceOrder.status,
              total: raceOrder.total,
              note: 'Orden creada por request concurrente (handling race condition)',
            },
            { status: 200 }
          )
        }
      }

      // Error inesperado
      throw transactionError
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error'
    console.error('[Order POST Error]', message, error)

    return NextResponse.json(
      { error: `Error interno: ${message}` },
      { status: 500 }
    )
  }
}
