'use client'

import { useState } from 'react'

interface ToggleStatusButtonProps {
  isActive: boolean
  entityType: string
  entityName: string
  onToggle: () => Promise<unknown>
  size?: 'xs' | 'sm'
}

export default function ToggleStatusButton({ isActive, entityType, entityName, onToggle, size = 'xs' }: ToggleStatusButtonProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    if (submitting) return
    setOpen(false)
    setError('')
  }

  const handleConfirm = async () => {
    if (submitting) return
    setSubmitting(true)
    setError('')

    try {
      await onToggle()
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado')
    } finally {
      setSubmitting(false)
    }
  }

  const px = size === 'xs' ? 'px-3 py-1' : 'px-4 py-2'
  const textSize = size === 'xs' ? 'text-xs' : 'text-sm'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`rounded-lg border ${px} ${textSize} font-medium transition ${
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
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:border dark:border-slate-700"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              {isActive ? `Desactivar ${entityType}` : `Activar ${entityType}`}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
              {isActive ? (
                <>¿Seguro que quieres desactivar {entityType === 'vendedor' ? 'a' : 'el'} <strong>{entityName}</strong>? No aparecerá en BuyerApp ni podrá recibir nuevos pedidos.</>
              ) : (
                <>¿Seguro que quieres activar {entityType === 'vendedor' ? 'a' : 'el'} <strong>{entityName}</strong>? Volverá a aparecer en BuyerApp y podrá recibir pedidos.</>
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
                disabled={submitting}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${
                  isActive
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {submitting
                  ? (isActive ? 'Desactivando...' : 'Activando...')
                  : (isActive ? 'Desactivar' : 'Activar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
