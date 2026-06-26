'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { confirmOrderForDelivery } from '@/app/actions/order'
import Button from '@/components/ui/Button'

interface ConfirmOrderDialogProps {
  orderId: string
}

export default function ConfirmOrderDialog({ orderId }: ConfirmOrderDialogProps) {
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
      const result = await confirmOrderForDelivery(orderId)
      const { delivery, buyer } = result.notifications

      if (!delivery.success) {
        toast.error(`DeliveryApp: ${delivery.error ?? 'Error desconocido'}`)
      }
      if (!buyer.success) {
        toast.error(`BuyerApp: ${buyer.error ?? 'Error desconocido'}`)
      }
      if (delivery.success && buyer.success) {
        toast.success('Orden confirmada y notificada correctamente')
        setOpen(false)
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al confirmar la orden'
      toast.error(msg)
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
            className="w-full max-w-md rounded-xl bg-gradient-to-br from-white/50 to-slate-100/50 p-6 shadow-xl shadow-black/5 backdrop-blur-xl border border-white/30 dark:from-slate-900/70 dark:to-slate-800/70 dark:border-slate-700/40"
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
