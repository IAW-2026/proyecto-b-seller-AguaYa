/**
 * types.ts — Tipos compartidos para el sistema de almacenamiento de imágenes.
 *
 * Define contratos provider-agnostic para subir y eliminar imágenes.
 * Cada proveedor (Cloudinary, S3, etc.) implementa estas interfaces.
 */

export interface UploadResult {
  url: string
  publicId: string
}

/**
 * Función que sube un archivo y retorna su URL + identificador.
 * Cada proveedor implementa su propia lógica (direct upload, server upload, etc.).
 */
export type UploadFunction = (file: File, folder?: string) => Promise<UploadResult>

/**
 * Función que elimina un archivo por su identificador público.
 */
export type DeleteFunction = (publicId: string) => Promise<void>
