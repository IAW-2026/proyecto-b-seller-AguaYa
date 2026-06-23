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
