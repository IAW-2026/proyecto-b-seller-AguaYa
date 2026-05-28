'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrUpdateVendor } from '@/app/actions/vendor'
import Button from '@/components/ui/Button'
import ImageUpload from '@/components/ui/ImageUpload'
import { validateVendorInput } from '../lib/validation'

interface VendorFormProps {
  initialData?: {
    name: string
    address: string
    description?: string
    cuil?: string
    cuit?: string
    image?: string
  }
  redirectTo?: string
}

export default function VendorForm({ initialData, redirectTo }: VendorFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    address: initialData?.address || '',
    description: initialData?.description || '',
    cuil: initialData?.cuil || '',
    cuit: initialData?.cuit || '',
    image: initialData?.image || '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = validateVendorInput(formData)

      await createOrUpdateVendor(payload)
      setError('')
      setLoading(false)

      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('AguaYa', { body: 'Cambios guardados exitosamente.' })
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission()
          if (permission === 'granted') {
            new Notification('AguaYa', { body: 'Cambios guardados exitosamente.' })
          }
        }
      }

      if (redirectTo) {
        router.push(redirectTo)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="p-3 bg-red-100 text-red-600 rounded-lg mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1.5 text-sm font-medium">Nombre *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ej: Agua Pura SA"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block mb-1.5 text-sm font-medium">Dirección *</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Ej: Av. Mitre 512"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block mb-1.5 text-sm font-medium">CUIL</label>
          <input
            type="text"
            name="cuil"
            value={formData.cuil}
            onChange={handleChange}
            placeholder="Ej: 20-12345678-9"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block mb-1.5 text-sm font-medium">CUIT</label>
          <input
            type="text"
            name="cuit"
            value={formData.cuit}
            onChange={handleChange}
            placeholder="Ej: 30-12345678-9"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="mt-4">
        <ImageUpload
          value={formData.image}
          onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
          folder="avatars"
          label="Logo de negocio"
        />
      </div>

      <div className="mt-4">
        <label className="block mb-1.5 text-sm font-medium">Descripción del negocio</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Cuéntanos sobre tu negocio..."
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm min-h-[100px] resize-y"
        />
      </div>

      <div className="mt-6">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  )
}
