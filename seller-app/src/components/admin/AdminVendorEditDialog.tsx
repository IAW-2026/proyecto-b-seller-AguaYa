'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateVendorAsAdmin } from '@/app/actions/admin-vendor'
import ImageUpload from '@/components/ui/ImageUpload'

interface AdminVendorEditDialogProps {
  vendor: {
    id: string
    name: string
    address: string
    description: string | null
    cuil: string | null
    cuit: string | null
    image: string | null
  }
}

function formatCuilCuit(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}

export default function AdminVendorEditDialog({ vendor }: AdminVendorEditDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(vendor.name)
  const [address, setAddress] = useState(vendor.address)
  const [description, setDescription] = useState(vendor.description || '')
  const [cuil, setCuil] = useState(vendor.cuil || '')
  const [cuit, setCuit] = useState(vendor.cuit || '')
  const [image, setImage] = useState(vendor.image || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await updateVendorAsAdmin(vendor.id, {
        name,
        address,
        description: description || undefined,
        cuil: cuil || undefined,
        cuit: cuit || undefined,
        image: image || undefined,
      })
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-sky-600 px-3 py-1 text-xs font-medium text-sky-600 transition hover:bg-sky-600 hover:text-white dark:border-sky-400 dark:text-sky-400 dark:hover:bg-sky-500 dark:hover:text-white"
      >
        Editar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-10"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:border dark:border-slate-700"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Editar vendedor</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-100 text-red-600 rounded-lg mb-4 dark:bg-red-900/50 dark:text-red-400 text-sm">{error}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block mb-1 text-sm font-medium dark:text-slate-300">Nombre *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium dark:text-slate-300">Dirección *</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium dark:text-slate-300">CUIL</label>
                <input value={cuil} onChange={(e) => setCuil(formatCuilCuit(e.target.value))} maxLength={13} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium dark:text-slate-300">CUIT</label>
                <input value={cuit} onChange={(e) => setCuit(formatCuilCuit(e.target.value))} maxLength={13} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
              </div>
              <div>
                <ImageUpload
                  value={image}
                  onChange={setImage}
                  folder="avatars"
                  label="Logo de negocio"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium dark:text-slate-300">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={250} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white min-h-[80px]" />
                <p className={`mt-1 text-xs text-right ${description.length >= 250 ? 'text-red-500 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                  {description.length}/250
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-between gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-700"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
