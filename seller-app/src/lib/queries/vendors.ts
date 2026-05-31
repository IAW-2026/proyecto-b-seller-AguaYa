import { prisma } from '@/lib/prisma'
import { paginate } from '@/lib/paginate'
import type { PaginatedResult } from '@/lib/paginate'
import type { Vendor, Product } from '@prisma/client'

export async function getVendorByUserId(userId: string) {
  return prisma.vendor.findUnique({
    where: { userId },
    select: {
      id: true,
      name: true,
      address: true,
      reputation: true,
      description: true,
      image: true,
      cuil: true,
      cuit: true,
      isActive: true,
    },
  })
}

export async function getVendorOverview(userId: string) {
  return prisma.vendor.findUnique({
    where: { userId },
    select: {
      id: true,
      name: true,
      address: true,
      description: true,
      reputation: true,
      isActive: true,
      _count: { select: { products: true, orders: true } },
      orders: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })
}

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

export async function getVendorProductsPaginated(vendorId: string, page: number = 1) {
  return paginate<Product>(
    prisma.product,
    { vendorId, deletedAt: null },
    { page, limit: 10, orderBy: { createdAt: 'desc' } }
  )
}

export async function listAllVendors() {
  return prisma.vendor.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })
}

export async function listAllVendorsPaginated(page: number = 1) {
  return paginate<Vendor>(
    prisma.vendor,
    { deletedAt: null },
    { page, limit: 10, orderBy: { createdAt: 'desc' } }
  )
}

export async function getVendorById(vendorId: string) {
  return prisma.vendor.findFirst({
    where: { id: vendorId, deletedAt: null },
  })
}
