'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateVendorAsAdmin } from '@/app/actions/admin-vendor'
import ImageUpload from '@/components/ui/ImageUpload'

function formatCuilCuit(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}

export default function AdminVendorEditDialog({
  vendor,
}: {
  vendor: {
    id: string
    name: string
    address: string
    description: string | null
    cuil: string | null
    cuit: string | null
    image: string | null
  }
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: vendor.name,
    address: vendor.address,
    description: vendor.description || '',
    cuil: vendor.cuil || '',
    cuit: vendor.cuit || '',
    image: vendor.image || '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'cuil' || name === 'cuit') {
      setForm((p) => ({ ...p, [name]: formatCuilCuit(value) }))
    } else {
      setForm((p) => ({ ...p, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await updateVendorAsAdmin(vendor.id, {
        name: form.name,
        address: form.address,
        description: form.description || undefined,
        cuil: form.cuil || undefined,
        cuit: form.cuit || undefined,
        image: form.image || undefined,
      })
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-sky-500 px-3 py-1 text-xs font-medium text-sky-600 transition hover:bg-sky-500 hover:text-white dark:text-sky-400 dark:border-sky-500 dark:hover:bg-sky-500 dark:hover:text-white"
      >
        Editar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-10"
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
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-600 dark:bg-red-900/50 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Nombre *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={100}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Dirección *</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  maxLength={200}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">CUIL</label>
                <input
                  name="cuil"
                  value={form.cuil}
                  onChange={handleChange}
                  placeholder="XX-XXXXXXXX-X"
                  maxLength={13}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">CUIT</label>
                <input
                  name="cuit"
                  value={form.cuit}
                  onChange={handleChange}
                  placeholder="XX-XXXXXXXX-X"
                  maxLength={13}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Descripción</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  maxLength={250}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 min-h-[80px]"
                />
              </div>

              <ImageUpload
                value={form.image}
                onChange={(url) => setForm((p) => ({ ...p, image: url }))}
                folder="vendors"
                label="Imagen"
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  {submitting ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
