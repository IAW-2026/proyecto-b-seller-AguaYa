import { cacheLife, cacheTag } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function getVendorByUserId(userId: string) {
  'use cache'
  cacheLife({ revalidate: 300, stale: 600 })
  cacheTag('vendor')
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
    },
  })
}

export async function getVendorOverview(userId: string) {
  'use cache'
  cacheLife({ revalidate: 15, stale: 300 })
  cacheTag('overview')
  return prisma.vendor.findUnique({
    where: { userId },
    include: {
      _count: { select: { products: true, orders: true } },
      products: { orderBy: { createdAt: 'desc' }, take: 5 },
      orders: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })
}

export async function getVendorProducts(vendorId: string) {
  'use cache'
  cacheLife({ revalidate: 300, stale: 600 })
  cacheTag('products')
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

export async function getVendorOrders(vendorId: string) {
  'use cache'
  cacheLife({ revalidate: 10, stale: 60 })
  cacheTag('orders')
  return prisma.order.findMany({
    where: { vendorId },
    include: {
      items: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProductById(productId: string, vendorId: string) {
  'use cache'
  cacheLife({ revalidate: 300, stale: 600 })
  cacheTag('products')
  return prisma.product.findFirst({
    where: { id: productId, vendorId, deletedAt: null },
  })
}
