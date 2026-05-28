'use client'

import { Package, CheckCircle } from 'lucide-react'
import type { Order, OrderItem, OrderStatus } from '@prisma/client'
import ConfirmOrderDialog from '@/components/orders/ConfirmOrderDialog'

export type OrderWithItems = Order & {
  items: (OrderItem & { product: any })[]
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  PAID: { label: 'Pagada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  READY: { label: 'Lista para entregar', color: 'bg-blue-100 text-blue-800', icon: Package },
}

export default function OrderCard({ order, showConfirmButton }: { order: OrderWithItems; showConfirmButton: boolean }) {
  const config = statusConfig[order.status]
  const StatusIcon = config.icon

  return (
    <div className="flex flex-col rounded-xl border border-slate-200/80 bg-white/80 p-4 shadow-sm">
      {/* Header: ID + Status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-slate-900 truncate">
            Orden {order.externalId || order.id.slice(0, 8)}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date(order.createdAt).toLocaleString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className={`shrink-0 px-2 py-0.5 rounded-full flex items-center gap-1 ${config.color}`}>
          <StatusIcon className="h-3 w-3" />
          <span className="text-xs font-medium">{config.label}</span>
        </div>
      </div>

      {/* Buyer + Total + Address */}
      <div className="space-y-1 mb-3 text-xs">
        <p>
          <span className="text-slate-500">Comprador:</span>{' '}
          <span className="font-medium text-slate-700">{order.buyerId.slice(0, 16)}</span>
        </p>
        <p>
          <span className="text-slate-500">Total:</span>{' '}
          <span className="font-semibold text-green-600">${order.total.toFixed(2)}</span>
        </p>
        <p className="truncate">
          <span className="text-slate-500">Dirección:</span>{' '}
          <span className="font-medium text-slate-700">{order.address || '—'}</span>
        </p>
      </div>

      {/* Products */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-slate-600 mb-1">Productos ({order.items.length})</p>
        <ul className="space-y-1">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-xs text-slate-600">
              <span className="truncate min-w-0">
                {item.productName}
                <span className="text-slate-400 ml-1">x{item.quantity}</span>
              </span>
              <span className="shrink-0 font-medium ml-2">${(item.productPrice * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Confirm button */}
      {showConfirmButton && (
        <div className="mt-auto pt-1">
          <ConfirmOrderDialog orderId={order.id} orderLabel={order.externalId || order.id.slice(0, 8)} />
        </div>
      )}
    </div>
  )
}
