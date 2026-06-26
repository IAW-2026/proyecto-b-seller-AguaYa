/**
 * index.ts — Punto de entrada del sistema de almacenamiento de imágenes.
 *
 * Resuelve qué proveedor de storage usar según STORAGE_PROVIDER.
 * Si no hay proveedor configurado, devuelve funciones mock que loguean
 * warnings sin crashear, permitiendo que el resto de la app funcione.
 *
 * Para cambiar de proveedor, solo se necesita:
 *   1. Crear un nuevo archivo (ej: s3.ts) implementando las interfaces
 *   2. Agregar el caso en getUploader() / getDeleter()
 *   3. Cambiar STORAGE_PROVIDER en .env
 */

import type { UploadFunction, DeleteFunction } from './types'
import { cloudinaryUpload, cloudinaryDelete } from './cloudinary'

/**
 * Retorna la función de upload según el proveedor configurado.
 */
export function getUploader(): UploadFunction {
  const provider = process.env.NEXT_PUBLIC_STORAGE_PROVIDER

  if (provider === 'cloudinary') return cloudinaryUpload

  if (!provider) {
    console.warn('[storage] STORAGE_PROVIDER no configurado. Las subidas de imágenes no estarán disponibles.')
  } else {
    console.warn(`[storage] Proveedor "${provider}" no soportado. Usando fallback.`)
  }

  return async (_file: File, _folder?: string) => {
    throw new Error('Servicio de imágenes no disponible. Configurá STORAGE_PROVIDER en .env')
  }
}

/**
 * Retorna la función de eliminación según el proveedor configurado.
 */
export function getDeleter(): DeleteFunction {
  const provider = process.env.NEXT_PUBLIC_STORAGE_PROVIDER

  if (provider === 'cloudinary') return cloudinaryDelete

  return async (_publicId: string) => {
    console.warn('[storage] Eliminación de imágenes no disponible: sin proveedor configurado')
  }
}
