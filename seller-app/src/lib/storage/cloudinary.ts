/**
 * cloudinary.ts — Implementación del storage provider para Cloudinary.
 *
 * Subida directa desde el browser (sin pasar por el servidor) usando
 * unsigned upload preset. La eliminación usa la API REST de Cloudinary
 * desde el servidor (requiere API Key + Secret).
 *
 * Prerrequisitos en Cloudinary Dashboard:
 *   1. Settings > Upload > Upload presets > Add preset (unsigned)
 *   2. Copiar el nombre del preset a NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 *   3. API Keys > crear key y copiar CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET
 */

import type { UploadResult, UploadFunction, DeleteFunction } from './types'

/**
 * Sube un archivo directamente a Cloudinary desde el browser.
 * Usa unsigned upload preset.
 */
export const cloudinaryUpload: UploadFunction = async (file: File, folder?: string): Promise<UploadResult> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary no configurado. Revisá NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME y NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  if (folder) formData.append('folder', folder)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData },
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`Cloudinary upload failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  return { url: data.secure_url, publicId: data.public_id }
}

/**
 * Elimina una imagen de Cloudinary por su publicId.
 * Se ejecuta desde el servidor (usa API Key + Secret).
 */
export const cloudinaryDelete: DeleteFunction = async (publicId: string): Promise<void> => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('[cloudinary] No configurado, no se puede eliminar imagen')
    return
  }

  const timestamp = Math.round(Date.now() / 1000)
  const message = `timestamp=${timestamp}&public_id=${publicId}${apiSecret}`
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(message))
  const signature = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        public_id: publicId,
        signature,
        api_key: apiKey,
        timestamp,
      }),
    },
  )

  if (!response.ok) {
    console.warn(`[cloudinary] Error deleting ${publicId}: ${await response.text().catch(() => '')}`)
  }
}
