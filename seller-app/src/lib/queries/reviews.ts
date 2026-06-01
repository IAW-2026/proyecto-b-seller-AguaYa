import { prisma } from '@/lib/prisma'
import { getServiceConfig } from '@/lib/external-api'

export type Review = {
  orderId: string
  rating: number
  description?: string
  createdAt: string
  products: string[]
}

export type ReviewStats = {
  promedio: number
  total: number
  reviews: Review[]
}

export async function getVendorReviewsWithStats(userId: string): Promise<ReviewStats> {
  const config = getServiceConfig('feedback')
  if (!config) return { promedio: 0, total: 0, reviews: [] }

  try {
    const url = `${config.baseUrl}/api/reviews/${userId}`
    const res = await fetch(url, {
      headers: config.apiKey ? { 'X-API-Key': config.apiKey } : {},
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return { promedio: 0, total: 0, reviews: [] }

    const data: {
      promedio: number
      total: number
      ultimasResenas: { id_pedido: string; estrellas: number; descripcion?: string; fecha: string }[]
    } = await res.json()

    if (!data.ultimasResenas?.length) {
      return { promedio: data.promedio ?? 0, total: data.total ?? 0, reviews: [] }
    }

    const orderIds = data.ultimasResenas.map((r) => r.id_pedido)
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, items: { select: { productName: true } } },
    })
    const productMap = new Map(orders.map((o) => [o.id, o.items.map((i) => i.productName)]))

    const reviews: Review[] = data.ultimasResenas.map((r) => ({
      orderId: r.id_pedido,
      rating: r.estrellas,
      description: r.descripcion,
      createdAt: r.fecha,
      products: productMap.get(r.id_pedido) ?? [],
    }))

    return { promedio: data.promedio, total: data.total, reviews }
  } catch {
    return { promedio: 0, total: 0, reviews: [] }
  }
}
