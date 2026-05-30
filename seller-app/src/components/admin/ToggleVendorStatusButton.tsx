'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toggleVendorActiveStatus } from '@/app/actions/admin-vendor'

export default function ToggleVendorStatusButton({ vendorId, isActive, vendorName }: { vendorId: string; isActive: boolean; vendorName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const submittingRef = useRef(false)

  const handleClose = () => {
    if (submittingRef.current) return
    setOpen(false)
    setError('')
  }

  const handleConfirm = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setError('')

    try {
      await toggleVendorActiveStatus(vendorId)
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado')
      submittingRef.current = false
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
          isActive
            ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
            : 'border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white'
        }`}
      >
        {isActive ? 'Desactivar' : 'Activar'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:border dark:border-slate-700"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              {isActive ? 'Desactivar vendedor' : 'Activar vendedor'}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
              {isActive ? (
                <>¿Seguro que quieres desactivar a <strong>{vendorName}</strong>? No aparecerá en BuyerApp ni podrá recibir nuevos pedidos.</>
              ) : (
                <>¿Seguro que quieres activar a <strong>{vendorName}</strong>? Volverá a aparecer en BuyerApp y podrá recibir pedidos.</>
              )}
            </p>

            {error && (
              <div className="mt-3 rounded-lg bg-red-100 p-3 text-sm text-red-600 dark:bg-red-900/50 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={submittingRef.current}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submittingRef.current}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${
                  isActive
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {submittingRef.current ? 'Procesando...' : (isActive ? 'Desactivar' : 'Activar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
