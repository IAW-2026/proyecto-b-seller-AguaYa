/**
 * order.ts — Server actions de gestión de órdenes del vendedor.
 *
 * Funciones:
 *   getVendorOrders()          → Retorna todas las órdenes del vendedor autenticado (cacheadas)
 *   updateOrderStatus()        → Cambia el estado de una orden (con validación de transición)
 *   confirmOrderForDelivery()  → Marca como READY + notifica a DeliveryApp y BuyerApp
 *
 * Las notificaciones externas usan un patrón Outbox: si el servicio destino está caído,
 * se encola el intento para reintentar automáticamente cada 60s.
 */

'use server'

import { prisma } from '@/lib/prisma'
import { getVendorContext } from '@/lib/vendor-context'
import { getCachedVendorOrders } from '@/lib/cache'
import { notifyExternalService } from '@/lib/external-api'
import { measure } from '@/lib/perf'
import { revalidatePath, revalidateTag } from 'next/cache'
import { OrderStatus } from '@prisma/client'

async function getAuthenticatedVendor() {
  const { vendor } = await getVendorContext()

  if (!vendor) {
    throw new Error('No autenticado')
  }

  return vendor
}

const ORDER_REVALIDATE_PATHS = ['/dashboard/orders', '/dashboard/overview']

const allowedStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  PAID: ['READY'],
  READY: [],
}

function assertValidStatusTransition(currentStatus: OrderStatus, nextStatus: OrderStatus) {
  const validNextStatuses = allowedStatusTransitions[currentStatus] ?? []

  if (!validNextStatuses.includes(nextStatus)) {
    throw new Error(`No se puede cambiar una orden ${currentStatus} a ${nextStatus}`)
  }
}

export async function getVendorOrders() {
  const vendor = await getAuthenticatedVendor()
  return getCachedVendorOrders(vendor.id)
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const vendor = await getAuthenticatedVendor()

  const order = await measure(`prisma.order.findFirst id=${orderId}`, async () =>
    prisma.order.findFirst({
      where: {
        id: orderId,
        vendorId: vendor.id,
      },
    })
  )

  if (!order) {
    throw new Error('No se encontró la orden para este vendedor')
  }

  assertValidStatusTransition(order.status, status)

  const updatedOrder = await measure(`prisma.order.update id=${orderId}`, async () =>
    prisma.order.update({
      where: { id: orderId },
      data: {
        status,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })
  )

  ORDER_REVALIDATE_PATHS.forEach((path) => revalidatePath(path))
  revalidateTag('orders', 'max')
  revalidateTag('overview', 'max')

  return updatedOrder
}

/**
 * Marca una orden como READY (lista para entregar) y notifica a los servicios externos.
 *
 * Flujo:
 *   1. Actualiza el estado de la orden local a READY
 *   2. Notifica a DeliveryApp (PUT /api/ready_orders/:id)
 *   3. Notifica a BuyerApp (PATCH /api/orders/:id/status)
 *   4. Si alguna notificación falla, se encola en Outbox para reintentar después
 *
 * Las notificaciones son fire-and-forget: un error externo no bloquea la confirmación local.
 */
export async function confirmOrderForDelivery(orderId: string) {
  const vendor = await getAuthenticatedVendor()

  // 1. Actualizar estado local
  const updatedOrder = await updateOrderStatus(orderId, 'READY')

  // 2. Notificar servicios externos (no bloqueante)
  const body = {
    orderId,
    vendorId: vendor.id,
    status: 'READY',
    timestamp: new Date().toISOString(),
  }

  await Promise.allSettled([
    notifyExternalService('delivery', `/api/ready_orders/${orderId}`, 'PUT', body, {
      enqueueOnFailure: true,
      orderId,
    }),
    notifyExternalService('buyer', `/api/orders/${orderId}/status`, 'PATCH', body, {
      enqueueOnFailure: true,
      orderId,
    }),
  ])

  return updatedOrder
}
