/**
 * vendors.ts — Consultas a la base de datos para la entidad Vendor.
 *
 * Proporciona funciones de lectura para obtener vendedores desde Prisma,
 * incluyendo búsqueda, paginación, ordenamiento y vistas para el dashboard.
 */
import { prisma } from '@/lib/prisma'
import { paginate } from '@/lib/paginate'
import { DEFAULT_PAGE_SIZE, VENDOR_PRODUCTS_PAGE_SIZE } from '@/lib/constants'
import type { Vendor, Product, Prisma } from '@prisma/client'

/** Obtiene un vendedor por su userId de Clerk (datos públicos del perfil). */
export async function getVendorByUserId(userId: string) {
  return prisma.vendor.findUnique({
    where: { userId },
    select: {
      id: true,
      name: true,
      address: true,
      description: true,
      image: true,
      cuil: true,
      cuit: true,
      isActive: true,
    },
  })
}

/**
 * Obtiene datos del dashboard de overview para un vendedor:
 * datos generales, conteo de productos/órdenes y últimas 8 órdenes.
 */
export async function getVendorOverview(userId: string) {
  return prisma.vendor.findUnique({
    where: { userId },
    select: {
      id: true,
      name: true,
      address: true,
      description: true,
      isActive: true,
      _count: { select: { products: true, orders: true } },
      orders: { orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, status: true, total: true, buyerName: true } },
    },
  })
}

/** Obtiene un vendedor con todos sus productos activos (no eliminados). */
export async function getVendorProducts(vendorId: string) {
  return prisma.vendor.findUnique({
    where: { id: vendorId },
    include: {
      products: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

/** Obtiene productos de un vendedor con paginación. */
export async function getVendorProductsPaginated(vendorId: string, page: number = 1) {
  return paginate<Product>(
    prisma.product,
    { vendorId, deletedAt: null },
    { page, limit: VENDOR_PRODUCTS_PAGE_SIZE, orderBy: { createdAt: 'desc' } }
  )
}

/**
 * Lista todos los vendedores (sin paginar) con filtro opcional por isActive.
 */
export async function listAllVendors(isActive?: boolean) {
  const where: Prisma.VendorWhereInput = { deletedAt: null }
  if (isActive !== undefined) {
    where.isActive = isActive
  }
  return prisma.vendor.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

const SORTABLE_VENDOR_COLS = ['name', 'isActive', 'createdAt'] as const

/** Lista vendedores paginados con ordenamiento por columnas configurables. */
export async function listAllVendorsPaginated(
  page: number = 1,
  opts?: { limit?: number; sortBy?: string; sortOrder?: string; isActive?: boolean }
) {
  const limit = opts?.limit ?? DEFAULT_PAGE_SIZE
  const where: Prisma.VendorWhereInput = { deletedAt: null }
  if (opts?.isActive !== undefined) {
    where.isActive = opts.isActive
  }
  let orderBy: Prisma.VendorOrderByWithRelationInput = { createdAt: 'desc' }
  if (opts?.sortBy && (SORTABLE_VENDOR_COLS as readonly string[]).includes(opts.sortBy)) {
    orderBy = { [opts.sortBy]: opts.sortOrder === 'desc' ? 'desc' : 'asc' }
  }
  return paginate<Vendor>(
    prisma.vendor,
    where,
    { page, limit, orderBy }
  )
}

/** Obtiene un vendedor por su ID (solo si no está eliminado). */
export async function getVendorById(vendorId: string) {
  return prisma.vendor.findFirst({
    where: { id: vendorId, deletedAt: null },
  })
}

function parseDateSafe(value: string | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Obtiene el total de órdenes y vendedores activos por día en un rango de fechas.
 */
export async function getVendorActivityByDateRange(
  from: string,
  to: string
): Promise<{ date: string; totalOrders: number; activeVendors: number }[]> {
  const fromDate = parseDateSafe(from)
  const toDate = parseDateSafe(to ? to + 'T23:59:59.999Z' : undefined)
  if (!fromDate || !toDate) return []

  const rows = await prisma.$queryRaw<
    { date: string; totalOrders: bigint; activeVendors: bigint }[]
  >`
    SELECT DATE("createdAt")::text as date,
      COUNT(*)::int as "totalOrders",
      COUNT(DISTINCT "vendorId")::int as "activeVendors"
    FROM "Order"
    WHERE "createdAt" >= ${fromDate}::date AND "createdAt" <= ${toDate} AND "deletedAt" IS NULL
    GROUP BY DATE("createdAt")
    ORDER BY DATE("createdAt")
  `

  const map = new Map<string, { totalOrders: number; activeVendors: number }>()
  for (const row of rows) {
    map.set(row.date, {
      totalOrders: Number(row.totalOrders),
      activeVendors: Number(row.activeVendors),
    })
  }

  const result: { date: string; totalOrders: number; activeVendors: number }[] = []
  for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    const entry = map.get(key) || { totalOrders: 0, activeVendors: 0 }
    result.push({ date: key, ...entry })
  }
  return result
}

/**
 * Obtiene el ranking de vendedores con más órdenes en un rango de fechas.
 */
export async function getTopVendorsByOrders(
  from: string,
  to: string,
  limit: number = 10
): Promise<{ vendorId: string; vendorName: string; totalOrders: number }[]> {
  const fromDate = parseDateSafe(from)
  const toDate = parseDateSafe(to ? to + 'T23:59:59.999Z' : undefined)
  if (!fromDate || !toDate) return []

  return prisma.$queryRaw<
    { vendorId: string; vendorName: string; totalOrders: bigint }[]
  >`
    SELECT o."vendorId" as "vendorId", v.name as "vendorName", COUNT(*)::int as "totalOrders"
    FROM "Order" o
    JOIN "Vendor" v ON v.id = o."vendorId"
    WHERE o."createdAt" >= ${fromDate}::date AND o."createdAt" <= ${toDate}
      AND o."deletedAt" IS NULL AND v."deletedAt" IS NULL
    GROUP BY o."vendorId", v.name
    ORDER BY COUNT(*) DESC
    LIMIT ${limit}
  `.then((rows) => rows.map((r) => ({ ...r, totalOrders: Number(r.totalOrders) })))
}

function fillTrendPeriods(
  data: { period: string; orders: bigint }[],
  start: Date,
  end: Date,
  isWeekly: boolean
): number[] {
  const map = new Map(data.map((r) => [r.period, Number(r.orders)]))
  const result: number[] = []
  const cursor = new Date(start)
  if (isWeekly) cursor.setDate(cursor.getDate() + ((7 - cursor.getDay()) % 7))
  while (cursor < end) {
    const key = cursor.toISOString().slice(0, 10)
    result.push(map.get(key) ?? 0)
    cursor.setDate(cursor.getDate() + (isWeekly ? 7 : 1))
  }
  return result
}

export async function getVendorGrowth(days: number) {
  const now = new Date()
  now.setHours(23, 59, 59, 999)
  const midDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  midDate.setHours(0, 0, 0, 0)
  const fromDate = new Date(midDate.getTime() - days * 24 * 60 * 60 * 1000)
  fromDate.setHours(0, 0, 0, 0)

  const isWeekly = days > 7

  const growthRows = await prisma.$queryRaw<
    { vendorId: string; vendorName: string; currentOrders: bigint; previousOrders: bigint }[]
  >`
    SELECT v.id as "vendorId", v.name as "vendorName",
      COUNT(CASE WHEN o."createdAt" >= ${midDate} AND o."createdAt" <= ${now} THEN 1 END)::int as "currentOrders",
      COUNT(CASE WHEN o."createdAt" >= ${fromDate} AND o."createdAt" < ${midDate} THEN 1 END)::int as "previousOrders"
    FROM "Vendor" v
    LEFT JOIN "Order" o ON o."vendorId" = v.id AND o."deletedAt" IS NULL
    WHERE v."deletedAt" IS NULL
    GROUP BY v.id, v.name
    ORDER BY "currentOrders" DESC
  `

  const vendorIds = growthRows.map((r) => r.vendorId)

  let trendRows: { vendorId: string; period: string; orders: bigint }[] = []
  if (vendorIds.length > 0) {
    const trunc = isWeekly ? 'week' : 'day'
    trendRows = await prisma.$queryRaw<
      { vendorId: string; period: string; orders: bigint }[]
    >`
      SELECT o."vendorId" as "vendorId",
        DATE_TRUNC(${trunc}, o."createdAt")::date::text as period,
        COUNT(*)::int as orders
      FROM "Order" o
      WHERE o."vendorId" = ANY(${vendorIds})
        AND o."createdAt" >= ${midDate} AND o."createdAt" <= ${now}
        AND o."deletedAt" IS NULL
      GROUP BY o."vendorId", DATE_TRUNC(${trunc}, o."createdAt")
      ORDER BY o."vendorId", period
    `
  }

  const trendMap = new Map<string, { period: string; orders: bigint }[]>()
  for (const row of trendRows) {
    if (!trendMap.has(row.vendorId)) trendMap.set(row.vendorId, [])
    trendMap.get(row.vendorId)!.push(row)
  }

  let growing = 0
  let declining = 0
  let stable = 0
  let growthSum = 0

  const vendors = growthRows.map((r) => {
    const prev = Number(r.previousOrders)
    const curr = Number(r.currentOrders)
    const growth = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0
    trendMap.get(r.vendorId)
    const rawTrend = trendMap.get(r.vendorId) ?? []
    const trend = fillTrendPeriods(rawTrend, midDate, now, isWeekly)

    if (growth > 5) growing++
    else if (growth < -5) declining++
    else stable++
    growthSum += growth

    return { vendorId: r.vendorId, vendorName: r.vendorName, currentOrders: curr, previousOrders: prev, growth, trend }
  })

  return {
    vendors,
    days,
    summary: {
      avgGrowth: vendors.length > 0 ? Math.round(growthSum / vendors.length) : 0,
      growing,
      declining,
      stable,
    },
  }
}
