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
  simple?: boolean
}

function formatCuilCuit(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}

export default function VendorForm({ initialData, redirectTo, simple }: VendorFormProps) {
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
  const [confirmOpen, setConfirmOpen] = useState(false)

  const descLength = formData.description.length

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleConfirm = async () => {
    setConfirmOpen(false)
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setConfirmOpen(true)
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="p-3 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 rounded-lg mb-4 text-sm font-medium">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={simple ? 'sm:col-span-2' : ''}>
          <label className="block mb-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">Nombre *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            maxLength={100}
            placeholder="Ej: Agua Pura SA"
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-500 dark:focus:border-slate-400 dark:focus:ring-slate-400"
          />
        </div>

        {!simple && (
          <>
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">Dirección *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                maxLength={200}
                placeholder="Ej: Av. Mitre 512"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-500 dark:focus:border-slate-400 dark:focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">CUIL</label>
              <input
                type="text"
                name="cuil"
                value={formData.cuil}
                onChange={(e) => setFormData((prev) => ({ ...prev, cuil: formatCuilCuit(e.target.value) }))}
                maxLength={13}
                placeholder="Ej: 20-12345678-9"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-500 dark:focus:border-slate-400 dark:focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">CUIT</label>
              <input
                type="text"
                name="cuit"
                value={formData.cuit}
                onChange={(e) => setFormData((prev) => ({ ...prev, cuit: formatCuilCuit(e.target.value) }))}
                maxLength={13}
                placeholder="Ej: 30-12345678-9"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-500 dark:focus:border-slate-400 dark:focus:ring-slate-400"
              />
            </div>
          </>
        )}
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
        <label className="block mb-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">Descripción del negocio</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Cuéntanos sobre tu negocio..."
          maxLength={250}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-500 dark:focus:border-slate-400 dark:focus:ring-slate-400 min-h-[100px] resize-y"
        />
        <p className={`mt-1 text-xs text-right ${descLength >= 250 ? 'text-red-500 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
          {descLength}/250
        </p>
      </div>

      <div className="mt-6">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:border dark:border-slate-700"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Guardar cambios
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
              ¿Seguro que quieres guardar los cambios?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" onClick={handleConfirm} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  )
}
