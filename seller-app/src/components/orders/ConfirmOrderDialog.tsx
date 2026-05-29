'use client'

import { useState } from 'react'
import { confirmOrderForDelivery } from '@/app/actions/order'
import Button from '@/components/ui/Button'

interface ConfirmOrderDialogProps {
  orderId: string
  orderLabel: string
}

export default function ConfirmOrderDialog({ orderId, orderLabel }: ConfirmOrderDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    if (!submitting) {
      setOpen(false)
    }
  }

  const handleConfirm = async () => {
    setSubmitting(true)

    try {
      await confirmOrderForDelivery(orderId)
      setOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button type="button" onClick={handleOpen}>
        Confirmar Orden
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
            aria-labelledby={`confirm-order-title-${orderId}`}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id={`confirm-order-title-${orderId}`} className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Confirmar orden
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
              Esta acción cambiara la orden de <strong>Pagada</strong> a <strong>Lista para entregar</strong>.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={submitting}>
                {submitting ? 'Confirmando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
