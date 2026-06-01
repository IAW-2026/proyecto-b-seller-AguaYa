'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAvailableClerkUsers, createVendorAsAdmin } from '@/app/actions/admin-vendor'

function formatCuilCuit(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}

export default function NewVendorPage() {
  const router = useRouter()
  const [clerkUsers, setClerkUsers] = useState<{ id: string; name: string; email: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    userId: '',
    name: '',
    address: '',
    description: '',
    cuil: '',
    cuit: '',
  })

  useEffect(() => {
    getAvailableClerkUsers()
      .then(setClerkUsers)
      .catch(() => setError('Error al cargar usuarios de Clerk'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.userId) {
      setError('Seleccioná un usuario de Clerk')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      await createVendorAsAdmin(form)
      router.push('/dashboard/admin/vendors')
      router.refresh()
    } catch {
      setError('Error al crear el vendedor')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Nuevo vendedor</h1>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Usuario de Clerk</label>
          {loading ? (
            <p className="text-sm text-slate-400">Cargando usuarios...</p>
          ) : (
            <select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            >
              <option value="">Seleccionar usuario...</option>
              {clerkUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del negocio</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            maxLength={100}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Dirección</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
            maxLength={200}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            maxLength={250}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">CUIL</label>
            <input
              type="text"
              value={form.cuil}
              onChange={(e) => setForm({ ...form, cuil: formatCuilCuit(e.target.value) })}
              maxLength={13}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">CUIT</label>
            <input
              type="text"
              value={form.cuit}
              onChange={(e) => setForm({ ...form, cuit: formatCuilCuit(e.target.value) })}
              maxLength={13}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-700"
          >
            {submitting ? 'Creando...' : 'Crear vendedor'}
          </button>
          <Link
            href="/dashboard/admin/vendors"
            className="rounded-lg bg-red-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-red-600"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
