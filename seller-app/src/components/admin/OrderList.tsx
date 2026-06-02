/**
 * Lista de pedidos paginada para el panel de administración.
 * Muestra pedidos filtrados por estado (PAID/READY) con opción de confirmar.
 */
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import type { Order, Paginated } from '@/lib/types'
import { updateOrderStatusAsAdmin } from '@/app/actions/admin-order'
import Pagination from '@/components/Pagination'

/** Lista paginada de pedidos con acción para marcar como listos. */
export default function OrderList({ orders, status }: { orders: Paginated<Order>; status: string }) {
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const paramKey = status === 'PAID' ? 'paid_page' : 'ready_page'

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(paramKey, String(page))
    return `${pathname}?${params.toString()}`
  }

  const handleConfirm = async (orderId: string) => {
    setUpdating(orderId)
    await updateOrderStatusAsAdmin(orderId, 'READY')
    setUpdating(null)
    router.refresh()
  }

  if (orders.items.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 dark:text-slate-500">
        <ShoppingBag className="mx-auto mb-4 h-10 w-10" />
        <p>{status === 'PAID' ? 'No hay órdenes pendientes.' : 'No hay órdenes listas.'}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-3">
        {orders.items.map((order) => (
          <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900 dark:text-white">#{order.externalId}</span>
                <span className="text-xs text-slate-600 dark:text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString('es-ES', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                order.status === 'PAID'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
              }`}>
                {order.status}
              </span>
            </div>
            <div className="mb-2 flex flex-wrap gap-x-1 text-xs text-slate-600 dark:text-slate-300">
              {order.items.map((item, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-slate-300 dark:text-slate-600">|</span>}
                  <span>{item.productName} x{item.quantity} — ${(item.productPrice * item.quantity).toFixed(2)}</span>
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Total: ${order.total.toFixed(2)}</span>
              {status === 'PAID' && (
                <button
                  onClick={() => handleConfirm(order.id)}
                  disabled={updating === order.id}
                  className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
                >
                  {updating === order.id ? '...' : 'Marcar lista'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {orders.pageCount > 1 && (
        <div className="mt-4">
          <Pagination
            page={orders.page}
            pageCount={orders.pageCount}
            onPageChange={(p) => router.push(buildPageUrl(p))}
          />
        </div>
      )}
    </div>
  )
}
