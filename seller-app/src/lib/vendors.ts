/**
 * Utilidades para manejo de datos de vendedores
 * Proyección de datos públicos, normalización, etc.
 */

import type { Vendor } from '@prisma/client'

/**
 * Interfaz de Vendedor Público
 * Contiene solo los datos que deben ser expuestos a través de la API
 * No incluye datos sensibles como userId, cuil, cuit, timestamps internos
 */
export interface PublicVendor {
  id: string
  name: string
  description: string | null
  address: string
  image: string | null
  isActive: boolean
  clerkUserId: string
  productCount: number
}

type VendorWithProducts = Vendor & {
  image?: string | null
  _count?: { products: number }
}

export function toPublicVendor(vendor: VendorWithProducts): PublicVendor {
  return {
    id: vendor.id,
    name: vendor.name,
    description: vendor.description,
    address: vendor.address,
    image: vendor.image ?? null,
    isActive: vendor.isActive,
    clerkUserId: vendor.userId,
    productCount: vendor._count?.products ?? 0,
  }
}

/**
 * Convierte un array de Vendors a sus representaciones públicas
 *
 * @param vendors - Array de Vendor objects
 * @returns Array de PublicVendor
 */
export function toPublicVendors(vendors: VendorWithProducts[]): PublicVendor[] {
  return vendors.map(toPublicVendor)
}

/**
 * Response estándar para listado de vendedores
 */
export interface VendorsListResponse {
  success: boolean
  vendors: PublicVendor[]
}

/**
 * Response estándar para un vendedor específico
 */
export interface VendorDetailResponse {
  success: boolean
  vendor: PublicVendor
}
