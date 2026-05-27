import { prisma } from '@/lib/prisma'
import { getServiceConfig } from '@/lib/external-api'

export type Review = {
  orderId: string
  buyerName: string
  rating: number
  description?: string
  createdAt: string
  products: string[]
}

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
    },
  })
}

export async function getVendorOverview(userId: string) {
  return prisma.vendor.findUnique({
    where: { userId },
    include: {
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
  page: number = 1
) {
  const limit = 10
  const skip = (page - 1) * limit
  const where = { vendorId, status, deletedAt: null }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return { items: items as any[], total, pageCount: Math.ceil(total / limit) }
}

export async function getProductById(productId: string, vendorId: string) {
  return prisma.product.findFirst({
    where: { id: productId, vendorId, deletedAt: null },
  })
}

export async function getVendorReviews(userId: string): Promise<Review[]> {
  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!vendor) return []

  const config = getServiceConfig('feedback')
  if (!config) return []

  try {
    const url = `${config.baseUrl}/api/reviews?vendor_id=${vendor.id}`
    const res = await fetch(url, {
      headers: config.apiKey ? { 'X-API-Key': config.apiKey } : {},
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []

    const data: { reviews: Omit<Review, 'products'>[] } = await res.json()
    if (!data.reviews?.length) return []

    const orderIds = data.reviews.map((r) => r.orderId)
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, items: { select: { productName: true } } },
    })
    const productMap = new Map(orders.map((o) => [o.id, o.items.map((i) => i.productName)]))

    return data.reviews.map((r) => ({
      ...r,
      products: productMap.get(r.orderId) ?? [],
    }))
  } catch {
    return []
  }
}

export async function listAllVendors() {
  return prisma.vendor.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })
}

export async function listAllVendorsPaginated(page: number = 1) {
  const limit = 15
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    prisma.vendor.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.vendor.count({ where: { deletedAt: null } }),
  ])

  return { items, total, pageCount: Math.ceil(total / limit) }
}

export async function getVendorById(vendorId: string) {
  return prisma.vendor.findFirst({
    where: { id: vendorId, deletedAt: null },
  })
}

export async function listAllProductsPaginated(page: number = 1) {
  const limit = 10
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null },
      include: { vendor: { select: { name: true, id: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where: { deletedAt: null } }),
  ])

  return { items, total, pageCount: Math.ceil(total / limit) }
}

export async function listAllOrdersPaginated(page: number = 1) {
  const limit = 10
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where: { deletedAt: null },
      include: {
        vendor: { select: { name: true, id: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where: { deletedAt: null } }),
  ])

  return { items, total, pageCount: Math.ceil(total / limit) }
}
