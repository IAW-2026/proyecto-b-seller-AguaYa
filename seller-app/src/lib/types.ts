/**
 * types.ts — Tipos de dominio de la aplicación.
 *
 * Define las estructuras de datos que se utilizan en la capa de presentación
 * (componentes y páginas). No incluye tipos de Prisma directamente.
 */

/** Representación de un vendedor para el dashboard. */
export type Vendor = {
  id: string
  name: string
  description: string | null
  address: string
  image: string | null
  cuil: string | null
  cuit: string | null
  clerkName: string
  clerkEmail: string
  isActive: boolean
}

/** Representación de un producto para el dashboard. */
export type Product = {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  image: string | null
  isActive: boolean
}

/** Item dentro de una orden (snapshot de producto al momento de compra). */
export type OrderItem = {
  productName: string
  productPrice: number
  quantity: number
}

/** Representación de una orden para el dashboard. */
export type Order = {
  id: string
  externalId: string
  status: string
  total: number
  address: string | null
  createdAt: string
  buyerId: string
  items: OrderItem[]
}

/** Reseña de un pedido, obtenida desde FeedbackApp. */
export type Review = {
  orderId: string
  rating: number
  description?: string
  createdAt: string
  products: string[]
}

/** Resultado paginado genérico con items, página actual y total de páginas. */
export type Paginated<T> = {
  items: T[]
  page: number
  pageCount: number
}
