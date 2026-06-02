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
 * Lista todos los vendedores (sin paginar) con búsqueda opcional
 * por nombre, CUIL o CUIT.
 */
export async function listAllVendors(q?: string) {
  const where: Prisma.VendorWhereInput = { deletedAt: null }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' as const } },
      { cuil: { contains: q, mode: 'insensitive' as const } },
      { cuit: { contains: q, mode: 'insensitive' as const } },
    ]
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
  opts?: { limit?: number; sortBy?: string; sortOrder?: string }
) {
  const limit = opts?.limit ?? DEFAULT_PAGE_SIZE
  let orderBy: Prisma.VendorOrderByWithRelationInput = { createdAt: 'desc' }
  if (opts?.sortBy && (SORTABLE_VENDOR_COLS as readonly string[]).includes(opts.sortBy)) {
    orderBy = { [opts.sortBy]: opts.sortOrder === 'desc' ? 'desc' : 'asc' }
  }
  return paginate<Vendor>(
    prisma.vendor,
    { deletedAt: null },
    { page, limit, orderBy }
  )
}

/** Obtiene un vendedor por su ID (solo si no está eliminado). */
export async function getVendorById(vendorId: string) {
  return prisma.vendor.findFirst({
    where: { id: vendorId, deletedAt: null },
  })
}
