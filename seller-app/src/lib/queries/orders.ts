import { prisma } from '@/lib/prisma'
import { paginate } from '@/lib/paginate'
import { buildSearchWhere } from '@/lib/search'
import type { Order, OrderItem, Product } from '@prisma/client'

type OrderWithItems = Order & { items: (OrderItem & { product: Product })[] }
type OrderWithVendorAndItems = Order & { vendor: { name: string; id: string }; items: (OrderItem & { product: Product })[] }

function dateFilter(from?: string, to?: string) {
  if (!from && !to) return {}
  const createdAt: Record<string, Date> = {}
  if (from) createdAt.gte = new Date(from)
  if (to) createdAt.lte = new Date(to + 'T23:59:59.999Z')
  return { createdAt }
}

export async function getVendorOrders(vendorId: string) {
  return prisma.order.findMany({
    where: { vendorId, deletedAt: null },
    include: {
      items: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getVendorOrdersByStatus(
  vendorId: string,
  status: 'PAID' | 'READY',
  page: number = 1,
  filters?: { q?: string; from?: string; to?: string }
) {
  return paginate<OrderWithItems>(
    prisma.order,
    {
      vendorId,
      status,
      deletedAt: null,
      ...buildSearchWhere(filters?.q, ['externalId', 'buyerName', 'buyerId', 'address']),
      ...dateFilter(filters?.from, filters?.to),
    },
    {
      page,
      limit: 4,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    }
  )
}

export async function getVendorOrdersByDateRange(
  vendorId: string,
  from: string,
  to: string
): Promise<{ date: string; paid: number; ready: number }[]> {
  const rows = await prisma.$queryRaw<{ date: string; status: string; count: bigint }[]>`
    SELECT DATE("createdAt")::text as date, status, COUNT(*)::int as count
    FROM "Order"
    WHERE "vendorId" = ${vendorId} AND "createdAt" >= ${new Date(from)}::date AND "createdAt" <= ${new Date(to + 'T23:59:59.999Z')} AND "deletedAt" IS NULL
    GROUP BY DATE("createdAt"), status
    ORDER BY DATE("createdAt")
  `

  const map = new Map<string, { paid: number; ready: number }>()

  for (const row of rows) {
    if (!map.has(row.date)) map.set(row.date, { paid: 0, ready: 0 })
    const entry = map.get(row.date)!
    if (row.status === 'PAID') entry.paid += Number(row.count)
    else entry.ready += Number(row.count)
  }

  const start = new Date(from)
  const end = new Date(to)
  const result: { date: string; paid: number; ready: number }[] = []

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    const entry = map.get(key) || { paid: 0, ready: 0 }
    result.push({ date: key, ...entry })
  }

  return result
}

export async function listAllOrdersPaginated(
  page: number = 1,
  filters?: { q?: string; from?: string; to?: string; status?: string }
) {
  const where: Record<string, unknown> = {
    deletedAt: null,
    ...dateFilter(filters?.from, filters?.to),
    ...(filters?.status ? { status: filters.status as 'PAID' | 'READY' } : {}),
  }

  if (filters?.q) {
    const q = filters.q
    where.OR = [
      { externalId: { contains: q, mode: 'insensitive' } },
      { buyerName: { contains: q, mode: 'insensitive' } },
      { buyerId: { contains: q, mode: 'insensitive' } },
      { address: { contains: q, mode: 'insensitive' } },
      { vendor: { name: { contains: q, mode: 'insensitive' } } },
    ]
  }

  return paginate<OrderWithVendorAndItems>(
    prisma.order,
    where,
    {
      page,
      limit: 10,
      include: {
        vendor: { select: { name: true, id: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    }
  )
}
