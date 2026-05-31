'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProduct } from '@/app/actions/product'
import { deleteProductAsAdmin } from '@/app/actions/admin-vendor'
import Button from '@/components/ui/Button'

interface DeleteProductDialogProps {
  productId: string
  productName: string
  vendorId?: string
}

export default function DeleteProductDialog({ productId, productName, vendorId }: DeleteProductDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    if (!submitting) setOpen(false)
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    setError('')

    try {
      if (vendorId) {
        await deleteProductAsAdmin(vendorId, productId)
      } else {
        await deleteProduct(productId)
      }
      setOpen(false)
      router.push(vendorId ? `/dashboard/admin/vendors/${vendorId}` : '/dashboard/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar producto')
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button type="button" variant="danger" disabled={submitting} onClick={handleOpen}>
        Eliminar producto
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="presentation"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:border dark:border-slate-700"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-product-title-${productId}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id={`delete-product-title-${productId}`} className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Eliminar producto
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
              ¿Seguro que quieres eliminar <strong>{productName}</strong>? Esta acción no se puede deshacer.
            </p>

            {error && (
              <div className="mt-3 p-3 bg-red-100 text-red-600 rounded-lg text-sm dark:bg-red-900/50 dark:text-red-400">{error}</div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="button" variant="danger" onClick={handleConfirm} disabled={submitting}>
                {submitting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
