/**
 * @file ProductFormDialog.tsx
 * @description Diálogo modal que envuelve el formulario de producto en modo creación o edición.
 */

'use client'

import { useState, type ReactNode } from 'react'
import ProductForm from '../ProductForm'

interface ProductFormDialogProps {
  children: ReactNode
  mode?: 'create' | 'edit'
  productId?: string
  vendorId?: string
  initialData?: {
    name: string
    description?: string
    price?: number
    stock?: number
    image?: string
  }
  disableRedirect?: boolean
}

/** Renderiza un modal con el formulario de producto para crear o editar. */
export default function ProductFormDialog({ children, mode = 'create', productId, vendorId, initialData, disableRedirect }: ProductFormDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div role="button" tabIndex={0} onClick={() => setOpen(true)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(true) }}>
        {children}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-10"
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:border dark:border-slate-700"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="product-form-title" className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                {mode === 'edit' ? 'Editar producto' : 'Nuevo producto'}
              </h2>
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
            <ProductForm mode={mode} productId={productId} vendorId={vendorId} initialData={initialData} disableRedirect={disableRedirect} onSuccess={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  )
}
