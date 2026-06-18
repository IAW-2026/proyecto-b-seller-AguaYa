/**
 * @file ConfirmOrderDialog.tsx
 * @description Diálogo modal para confirmar una orden pagada y cambiarla a estado "Lista para entregar".
 */

'use client'

import { useState } from 'react'
import { confirmOrderForDelivery } from '@/app/actions/order'
import Button from '@/components/ui/Button'

interface ConfirmOrderDialogProps {
  orderId: string
}

/** Renderiza el botón y modal para confirmar una orden como lista para entregar. */
export default function ConfirmOrderDialog({ orderId }: ConfirmOrderDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deliveryError, setDeliveryError] = useState<string | null>(null)
  const [buyerError, setBuyerError] = useState<string | null>(null)

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    if (!submitting) {
      setOpen(false)
      setDeliveryError(null)
      setBuyerError(null)
    }
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    setDeliveryError(null)
    setBuyerError(null)

    try {
      const result = await confirmOrderForDelivery(orderId)
      const { delivery, buyer } = result.notifications

      if (!delivery.success) {
        setDeliveryError(delivery.error ?? 'Error desconocido')
      }
      if (!buyer.success) {
        setBuyerError(buyer.error ?? 'Error desconocido')
      }
      if (delivery.success && buyer.success) {
        setOpen(false)
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al confirmar la orden'
      setDeliveryError(msg)
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

            {deliveryError ? (
              <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
                <p className="font-medium">Error notificando a DeliveryApp</p>
                <p className="mt-1 font-mono text-xs">{deliveryError}</p>
              </div>
            ) : null}

            {buyerError ? (
              <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <p className="font-medium">Error notificando a BuyerApp</p>
                <p className="mt-1 font-mono text-xs">{buyerError}</p>
              </div>
            ) : null}

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
