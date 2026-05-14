/**
 * Componente para mostrar el listado de órdenes del vendedor
 */

import ConfirmOrderDialog from '@/components/orders/ConfirmOrderDialog'
import { getVendorOrders } from '@/app/actions/order'
import { OrderStatus } from '@prisma/client'
import type { Order, OrderItem } from '@prisma/client'
import { AlertCircle, Package, Clock, CheckCircle, Truck, Home } from 'lucide-react'

type OrderWithItems = Order & {
  items: (OrderItem & {
    product: any
  })[]
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  PENDING: {
    label: 'Pendiente de confirmar',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  CONFIRMED: {
    label: 'Confirmada',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle,
  },
  READY: {
    label: 'Lista para entregar',
    color: 'bg-green-100 text-green-800',
    icon: Package,
  },
  IN_DELIVERY: {
    label: 'En Entrega',
    color: 'bg-purple-100 text-purple-800',
    icon: Truck,
  },
  DELIVERED: {
    label: 'Entregada',
    color: 'bg-green-200 text-green-900',
    icon: Home,
  },
  CANCELLED: {
    label: 'Cancelada',
    color: 'bg-red-100 text-red-800',
    icon: AlertCircle,
  },
}

export default async function OrdersList() {
  let orders: OrderWithItems[] = []
  let error: string | null = null

  try {
    const result = await getVendorOrders()
    orders = result as OrderWithItems[]
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error al cargar órdenes'
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        <p className="font-semibold">Error: {error}</p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <p className="text-lg">No hay órdenes aún</p>
        <p className="text-sm">Las órdenes que recibas aparecerán aquí</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const config = statusConfig[order.status]
        const StatusIcon = config.icon
        const canConfirm = order.status === 'PENDING'

        return (
          <div
            key={order.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  Orden {order.externalId || order.id.slice(0, 8)}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString('es-ES', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </p>
              </div>

              {/* Status Badge */}
              <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${config.color}`}>
                <StatusIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{config.label}</span>
              </div>
            </div>

            {canConfirm ? (
              <div className="mb-4 flex justify-end">
                <ConfirmOrderDialog orderId={order.id} orderLabel={order.externalId || order.id.slice(0, 8)} />
              </div>
            ) : null}

            {/* Order Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="text-gray-600">Comprador</p>
                <p className="font-medium">{order.buyerId}</p>
              </div>
              <div>
                <p className="text-gray-600">Total</p>
                <p className="font-semibold text-green-600">${order.total.toFixed(2)}</p>
              </div>
            </div>

            {/* Items */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Productos ({order.items.length})</p>
              <ul className="space-y-2">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                    <span>
                      {item.productName}
                      <span className="text-gray-600 ml-2">x{item.quantity}</span>
                    </span>
                    <span className="font-medium">${(item.productPrice * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
              <span>ID: {order.id.slice(0, 12)}...</span>
              <span>{order.externalId ? `Ext: ${order.externalId}` : 'Sin ID externo'}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
