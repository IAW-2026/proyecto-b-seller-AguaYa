import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import { validateProductInput } from '@/lib/validation'
import { listAllProductsPaginated } from '@/lib/queries/products'
import type { ErrorResponse } from '@/lib/api-types'

export async function GET(request: Request) {
  try {
    const cpApiKey = process.env.CONTROL_PLANE_API_KEY
    if (!validateApiKey(request, cpApiKey)) {
      return NextResponse.json<ErrorResponse>({ error: 'X-API-Key inválida o faltante' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const q = searchParams.get('q') ?? undefined
    const isActive = searchParams.get('isActive')
    const sortBy = searchParams.get('sortBy') ?? undefined
    const sortOrder = searchParams.get('sortOrder') ?? undefined

    const result = await listAllProductsPaginated(page, {
      q,
      ...(isActive !== null ? { isActive: isActive === 'true' } : {}),
      sortBy,
      sortOrder,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error en GET /api/admin/products:', error)
    return NextResponse.json<ErrorResponse>({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cpApiKey = process.env.CONTROL_PLANE_API_KEY
    if (!validateApiKey(request, cpApiKey)) {
      return NextResponse.json<ErrorResponse>({ error: 'X-API-Key inválida o faltante' }, { status: 401 })
    }

    const body = await request.json()
    const { vendorId, ...productData } = body

    if (!vendorId || typeof vendorId !== 'string') {
      return NextResponse.json<ErrorResponse>({ error: 'vendorId es requerido' }, { status: 400 })
    }

    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, deletedAt: null } })
    if (!vendor) {
      return NextResponse.json<ErrorResponse>({ error: 'Vendedor no encontrado' }, { status: 404 })
    }

    const data = validateProductInput(productData)
    const product = await prisma.product.create({
      data: { ...data, vendorId },
    })

    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('Error en POST /api/admin/products:', error)
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 400 })
  }
}
