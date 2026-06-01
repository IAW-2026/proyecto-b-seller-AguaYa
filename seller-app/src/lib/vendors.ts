/**
 * Utilidades para manejo de datos de vendedores
 * Proyección de datos públicos, normalización, etc.
 */

import type { Vendor } from '@prisma/client'

type VendorWithImage = Vendor & {
  image?: string | null
}

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
}

/**
 * Convierte un Vendor de Prisma a su representación pública
 * Filtra campos sensibles y retorna solo los datos públicos
 *
 * @param vendor - Vendor object de Prisma
 * @returns PublicVendor - Vendedor con solo datos públicos
 */
export function toPublicVendor(vendor: VendorWithImage): PublicVendor {
  return {
    id: vendor.id,
    name: vendor.name,
    description: vendor.description,
    address: vendor.address,
    image: vendor.image ?? null,
  }
}

/**
 * Convierte un array de Vendors a sus representaciones públicas
 *
 * @param vendors - Array de Vendor objects
 * @returns Array de PublicVendor
 */
export function toPublicVendors(vendors: Vendor[]): PublicVendor[] {
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

/**
 * Response estándar para errores
 */
export interface ErrorResponse {
  error: string
}
