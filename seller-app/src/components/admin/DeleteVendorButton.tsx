/**
 * Botón para eliminar (desactivar) un vendedor desde el panel de administración.
 * Muestra un diálogo de confirmación antes de ejecutar la acción.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteVendorAsAdmin } from '@/app/actions/admin-vendor'

/** Botón con diálogo de confirmación para eliminar un vendedor. */
export default function DeleteVendorButton({ vendorId, vendorName }: { vendorId: string; vendorName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setSubmitting(true)
    setError('')
    try {
      await deleteVendorAsAdmin(vendorId)
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar vendedor')
      setSubmitting(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-lg border border-red-500 px-3 py-1 text-xs font-medium text-red-500 transition hover:bg-red-500 hover:text-white">
        Eliminar
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:border dark:border-slate-700"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-vendor-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-vendor-title" className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Eliminar vendedor
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
              ¿Seguro que quieres desactivar a <strong>{vendorName}</strong>? Esta acción no se puede deshacer.
            </p>

            {error && (
              <div className="mt-3 p-3 bg-red-100 text-red-600 rounded-lg text-sm dark:bg-red-900/50 dark:text-red-400">{error}</div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {submitting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
