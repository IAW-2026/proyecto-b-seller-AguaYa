'use client'

import { useState, type ReactNode } from 'react'
import ProductForm from '../ProductForm'

interface ProductFormDialogProps {
  children: ReactNode
  mode?: 'create' | 'edit'
  productId?: string
  initialData?: {
    name: string
    description?: string
    price?: number
    stock?: number
    image?: string
  }
}

export default function ProductFormDialog({ children, mode = 'create', productId, initialData }: ProductFormDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <span className="inline-contents" onClick={() => setOpen(true)}>
        {children}
      </span>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-10"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {mode === 'edit' ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ProductForm mode={mode} productId={productId} initialData={initialData} onSuccess={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  )
}
