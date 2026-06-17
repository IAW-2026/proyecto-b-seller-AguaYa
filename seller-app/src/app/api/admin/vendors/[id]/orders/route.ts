import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import type { ErrorResponse } from '@/lib/api-types'

interface RouteParams {
  params: Promise<{ id: string }>
}

function parseDateSafe(value: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
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
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: Record<string, unknown> = { vendorId: id, deletedAt: null }

    const fromDate = parseDateSafe(from)
    const toDate = parseDateSafe(to ? to + 'T23:59:59.999Z' : null)

    if (fromDate || toDate) {
      const createdAt: Record<string, Date> = {}
      if (fromDate) createdAt.gte = fromDate
      if (toDate) createdAt.lte = toDate
      where.createdAt = createdAt
    }

    if (q) {
      where.OR = [
        { externalId: { contains: q, mode: 'insensitive' } },
        { buyerName: { contains: q, mode: 'insensitive' } },
        { items: { some: { product: { name: { contains: q, mode: 'insensitive' } } } } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({ success: true, items, total, pageCount: Math.ceil(total / limit) }, { status: 200 })
  } catch (error) {
    console.error('Error en GET /api/admin/vendors/[id]/orders:', error)
    return NextResponse.json<ErrorResponse>({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
