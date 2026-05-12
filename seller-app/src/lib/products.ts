/**
 * Utilidades para manejo de datos de productos
 * Proyección de datos públicos, normalización, etc.
 */

import type { Product } from '@prisma/client'

/**
 * Interfaz de Producto Público
 * Contiene solo los datos que deben ser expuestos a través de la API
 * No incluye timestamps internos (createdAt, updatedAt)
 */
export interface PublicProduct {
  id: string
  vendorId: string
  name: string
  description: string | null
  price: number
  stock: number
  image: string | null
}

/**
 * Convierte un Product de Prisma a su representación pública
 * Filtra campos internos y retorna solo los datos públicos
 *
 * @param product - Product object de Prisma
 * @returns PublicProduct - Producto con solo datos públicos
 */
export function toPublicProduct(product: Product): PublicProduct {
  return {
    id: product.id,
    vendorId: product.vendorId,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    image: product.image ?? null,
  }
}

/**
 * Convierte un array de Products a sus representaciones públicas
 *
 * @param products - Array de Product objects
 * @returns Array de PublicProduct
 */
export function toPublicProducts(products: Product[]): PublicProduct[] {
  return products.map(toPublicProduct)
}

/**
 * Response estándar para listado de productos
 */
export interface ProductsListResponse {
  success: boolean
  products: PublicProduct[]
}

/**
 * Response estándar para errores
 */
export interface ErrorResponse {
  error: string
}

/**
 * Parámetros de filtro para buscar productos
 */
export interface ProductFilterParams {
  vendorIds?: string[]
  minPrice?: number
  maxPrice?: number
}
