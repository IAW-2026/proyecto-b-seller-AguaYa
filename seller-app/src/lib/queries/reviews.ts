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
