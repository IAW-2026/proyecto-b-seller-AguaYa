import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import type { ErrorResponse } from '@/lib/api-types'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const cpApiKey = process.env.CONTROL_PLANE_API_KEY
    if (!validateApiKey(request, cpApiKey)) {
      return NextResponse.json<ErrorResponse>({ error: 'X-API-Key inválida o faltante' }, { status: 401 })
    }

    const { id } = await params
    const vendor = await prisma.vendor.findFirst({ where: { id, deletedAt: null } })
    if (!vendor) {
      return NextResponse.json<ErrorResponse>({ error: 'Vendedor no encontrado' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '5', 10)))
    const q = searchParams.get('q')

    const where: Record<string, unknown> = { vendorId: id, deletedAt: null }
    if (q) {
      where.name = { contains: q, mode: 'insensitive' }
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({ success: true, items, total, pageCount: Math.ceil(total / limit) }, { status: 200 })
  } catch (error) {
    console.error('Error en GET /api/admin/vendors/[id]/products:', error)
    return NextResponse.json<ErrorResponse>({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
