/**
 * constants.ts — Constantes globales de la aplicación.
 *
 * Agrupa límites de validación, tamaños de paginación y configuraciones
 * generales para mantenerlas centralizadas y fáciles de modificar.
 */

// Límites de caracteres para validación de formularios
export const MAX_NAME_LENGTH = 100
export const MAX_ADDRESS_LENGTH = 200
export const MAX_DESCRIPTION_LENGTH = 250
export const MAX_IMAGE_URL_LENGTH = 1000

// Tamaños de página para consultas paginadas
export const ADMIN_PAGE_SIZE = 5
export const VENDOR_ORDERS_PAGE_SIZE = 4
export const DEFAULT_PAGE_SIZE = 10
export const VENDOR_PRODUCTS_PAGE_SIZE = 10

// Límite de usuarios a obtener desde Clerk en una sola llamada
export const CLERK_USERS_FETCH_LIMIT = 500
