/**
 * orders.ts — Consultas a la base de datos para la entidad Order.
 *
 * Proporciona funciones de lectura para órdenes del dashboard del vendedor
 * y del admin, con paginación, filtros por estado, fechas y búsqueda.
 */
import { prisma } from '@/lib/prisma'
import { paginate } from '@/lib/paginate'
import { buildSearchWhere } from '@/lib/search'
import { ADMIN_PAGE_SIZE, VENDOR_ORDERS_PAGE_SIZE } from '@/lib/constants'
import type { Order, OrderItem, Product } from '@prisma/client'

type OrderWithItems = Order & { items: (OrderItem & { product: Product })[] }
type OrderWithVendorAndItems = Order & { vendor: { name: string; id: string }; items: (OrderItem & { product: Product })[] }

function parseDateSafe(value: string | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

function dateFilter(from?: string, to?: string) {
  if (!from && !to) return {}
  const createdAt: Record<string, Date> = {}
  const fromDate = parseDateSafe(from)
  const toDate = parseDateSafe(to ? to + 'T23:59:59.999Z' : undefined)
  if (fromDate) createdAt.gte = fromDate
  if (toDate) createdAt.lte = toDate
  return { createdAt }
}

/** Obtiene todas las órdenes de un vendedor (sin paginar). */
export async function getVendorOrders(vendorId: string) {
  return prisma.order.findMany({
    where: { vendorId, deletedAt: null },
    include: {
      items: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Obtiene órdenes de un vendedor filtradas por estado y con paginación.
 * Soporta búsqueda por externalId, buyerName, buyerId, address y filtro por fechas.
 */
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
      limit: VENDOR_ORDERS_PAGE_SIZE,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    }
  )
}

/**
 * Obtiene el conteo de órdenes por día (PAID y READY) en un rango de fechas.
 * Usa una query SQL raw para agregación eficiente.
 */
export async function getVendorOrdersByDateRange(
  vendorId: string,
  from: string,
  to: string
): Promise<{ date: string; paid: number; ready: number }[]> {
  const fromDate = parseDateSafe(from)
  const toDate = parseDateSafe(to ? to + 'T23:59:59.999Z' : undefined)
  if (!fromDate || !toDate) return []

  const rows = await prisma.$queryRaw<{ date: string; status: string; count: bigint }[]>`
    SELECT DATE("createdAt")::text as date, status, COUNT(*)::int as count
    FROM "Order"
    WHERE "vendorId" = ${vendorId} AND "createdAt" >= ${fromDate}::date AND "createdAt" <= ${toDate}::date AND "deletedAt" IS NULL
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

  const result: { date: string; paid: number; ready: number }[] = []

  for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    const entry = map.get(key) || { paid: 0, ready: 0 }
    result.push({ date: key, ...entry })
  }

  return result
}

/** Obtiene una orden por ID (solo si no está eliminada), con vendor e items. */
export async function getOrderById(orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    include: {
      vendor: { select: { id: true, name: true } },
      items: { include: { product: true } },
    },
  })
}

/**
 * Lista todas las órdenes del sistema (admin) con paginación.
 * Soporta búsqueda por externalId, buyerName, buyerId, address y nombre de vendedor,
 * filtro por fechas y filtro por estado.
 */
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
      limit: ADMIN_PAGE_SIZE,
      include: {
        vendor: { select: { name: true, id: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    }
  )
}
