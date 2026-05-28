'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import ConfirmOrderDialog from '@/components/orders/ConfirmOrderDialog'
import Pagination from '@/components/Pagination'
import { Package, CheckCircle } from 'lucide-react'
import type { Order, OrderItem, OrderStatus } from '@prisma/client'

type OrderWithItems = Order & {
  items: (OrderItem & { product: any })[]
}

type TabId = 'confirm' | 'ready'

const TABS: { id: TabId; label: string }[] = [
  { id: 'confirm', label: 'Para confirmar' },
  { id: 'ready', label: 'Listas para entregar' },
]

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  PAID: { label: 'Pagada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  READY: { label: 'Lista para entregar', color: 'bg-blue-100 text-blue-800', icon: Package },
}

function OrderCard({ order, showConfirmButton }: { order: OrderWithItems; showConfirmButton: boolean }) {
  const config = statusConfig[order.status]
  const StatusIcon = config.icon

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
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
        <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${config.color}`}>
          <StatusIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{config.label}</span>
        </div>
      </div>

      {showConfirmButton ? (
        <div className="mb-4 flex justify-end">
          <ConfirmOrderDialog orderId={order.id} orderLabel={order.externalId || order.id.slice(0, 8)} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-600">Comprador</p>
          <p className="font-medium">{order.buyerId}</p>
        </div>
        <div>
          <p className="text-gray-600">Total</p>
          <p className="font-semibold text-green-600">${order.total.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600">Dirección</p>
          <p className="font-medium">{order.address || '—'}</p>
        </div>
      </div>

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

      
    </div>
  )
}

export default function OrdersTabs({
  paidOrders,
  paidPage,
  paidPageCount,
  readyOrders,
  readyPage,
  readyPageCount,
}: {
  paidOrders: OrderWithItems[]
  paidPage: number
  paidPageCount: number
  readyOrders: OrderWithItems[]
  readyPage: number
  readyPageCount: number
}) {
  const [activeTab, setActiveTab] = useState<TabId>('confirm')
  const router = useRouter()
  const pathname = usePathname()

  const currentOrders = activeTab === 'confirm' ? paidOrders : readyOrders
  const showConfirmButton = activeTab === 'confirm'

  const currentPage = activeTab === 'confirm' ? paidPage : readyPage
  const currentPageCount = activeTab === 'confirm' ? paidPageCount : readyPageCount

  function handlePageChange(page: number) {
    const param = activeTab === 'confirm' ? 'paid_page' : 'ready_page'
    router.push(`${pathname}?${param}=${page}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((tab) => {
          const count = tab.id === 'confirm' ? paidPageCount > 1 ? `${(paidPage - 1) * 10 + 1}-${Math.min(paidPage * 10, paidOrders.length)}` : paidOrders.length : readyPageCount > 1 ? `${(readyPage - 1) * 10 + 1}-${Math.min(readyPage * 10, readyOrders.length)}` : readyOrders.length
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      {currentOrders.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
          <Package className="mx-auto mb-4 h-10 w-10 text-gray-300" />
          <p className="text-base">
            {activeTab === 'confirm'
              ? 'No hay órdenes pendientes'
              : 'No hay órdenes listas para entregar'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              showConfirmButton={showConfirmButton}
            />
          ))}
        </div>
      )}

      <Pagination page={currentPage} pageCount={currentPageCount} onPageChange={handlePageChange} />
    </div>
  )
}
