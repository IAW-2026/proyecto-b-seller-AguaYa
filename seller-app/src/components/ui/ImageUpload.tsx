/**
 * ImageUpload.tsx — Componente reutilizable de subida de imágenes.
 *
 * Ofrece dos modos de ingreso:
 *   1. File picker con preview y subida a Cloudinary (u otro provider)
 *   2. Campo de texto para pegar una URL manualmente (fallback)
 *
 * Props:
 *   value     → URL actual de la imagen
 *   onChange  → callback con la nueva URL
 *   folder    → subcarpeta en el storage (ej: 'products', 'avatars')
 *   label     → texto del label (default 'Imagen')
 */

'use client'

import { useState, useRef } from 'react'
import { getUploader } from '@/lib/storage'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  folder?: string
  label?: string
}

export default function ImageUpload({ value, onChange, folder = 'general', label = 'Imagen' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useUrlInput, setUseUrlInput] = useState(!!value && !value.startsWith('blob:'))
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      const uploader = getUploader()
      const result = await uploader(file, folder)
      onChange(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Preview */}
      {value && !useUrlInput && (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}

      {/* File picker / URL toggle */}
      <div className="flex items-center gap-3">
        {!useUrlInput ? (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => setUseUrlInput(true)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              o pegar URL
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              value={value}
              onChange={handleUrlChange}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => {
                setUseUrlInput(false)
                onChange('')
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              subir archivo
            </button>
          </>
        )}
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
