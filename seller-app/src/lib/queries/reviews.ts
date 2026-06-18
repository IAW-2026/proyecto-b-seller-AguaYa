/**
 * reviews.ts — Consulta de reseñas desde FeedbackApp.
 *
 * Obtiene las reseñas de un vendedor consultando la API de FeedbackApp
 * y enriquece los datos con los nombres de los productos desde la BD local.
 * Si FeedbackApp no está disponible, retorna datos vacíos sin error.
 */
import { prisma } from '@/lib/prisma'
import { getServiceConfig } from '@/lib/external-api'

/** Reseña de un pedido con datos básicos. */
export type Review = {
  orderId: string
  rating: number
  description?: string
  createdAt: string
  products: string[]
}

/** Estadísticas de reseñas de un vendedor. */
export type ReviewStats = {
  promedio: number
  total: number
  reviews: Review[]
}

/**
 * Obtiene las reseñas y estadísticas de un vendedor desde FeedbackApp.
 * Consulta la API externa, cruza los orderIds con la BD local para
 * obtener nombres de productos, y retorna datos estructurados.
 * Si FeedbackApp no responde, retorna valores vacíos.
 */
export async function getVendorReviewsWithStats(userId: string): Promise<ReviewStats> {
  const config = getServiceConfig('feedback')
  if (!config) {
    console.warn(`[reviews] FEEDBACK_APP_URL no configurada — no se pueden obtener reseñas`)
    return { promedio: 0, total: 0, reviews: [] }
  }

  const url = `${config.baseUrl}/api/feedback/reviews/${userId}`
  console.warn(`[reviews] GET ${url}`)

  try {
    const res = await fetch(url, {
      headers: config.apiKey ? { 'X-API-Key': config.apiKey } : {},
      signal: AbortSignal.timeout(5000),
    })

    console.warn(`[reviews] Status: ${res.status} ${res.statusText}`)

    if (!res.ok) {
      const body = await res.text().catch(() => 'sin cuerpo')
      console.warn(`[reviews] Error body: ${body}`)
      return { promedio: 0, total: 0, reviews: [] }
    }

    const data: {
      promedio: number
      total: number
      ultimasResenas: { id_pedido: string; estrellas: number; comentario?: string; fecha: string }[]
    } = await res.json()

    console.warn(`[reviews] Respuesta recibida — promedio: ${data.promedio}, total: ${data.total}, reseñas: ${data.ultimasResenas?.length ?? 0}`)

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
      description: r.comentario,
      createdAt: r.fecha,
      products: productMap.get(r.id_pedido) ?? [],
    }))

    console.warn(`[reviews] OK — ${reviews.length} reseñas mapeadas para el vendedor ${userId}`)

    return { promedio: data.promedio, total: data.total, reviews }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.warn(`[reviews] Error fetching: ${msg}`)
    return { promedio: 0, total: 0, reviews: [] }
  }
}
