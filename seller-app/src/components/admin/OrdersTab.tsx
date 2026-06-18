/**
 * Tab de pedidos con sub-tabs para filtrar entre pedidos pendientes y listos para entregar.
 */
'use client'

import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import type { Order, Paginated } from '@/lib/types'
import OrderList from './OrderList'

/** Tabs internos para filtrar pedidos pagados vs listos para entregar. */
export default function OrdersTab({
  paidOrders,
  readyOrders,
}: {
  paidOrders: Paginated<Order>
  readyOrders: Paginated<Order>
}) {
  const [activeSubTab, setActiveSubTab] = useState<'paid' | 'ready'>('paid')

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-lg bg-gradient-to-br from-slate-100/70 to-slate-200/50 p-1 dark:from-slate-800/60 dark:to-slate-800/40">
        <button
          onClick={() => setActiveSubTab('paid')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            activeSubTab === 'paid'
              ? 'bg-gradient-to-br from-white/60 to-slate-100/60 text-slate-900 shadow-sm backdrop-blur-sm dark:from-slate-700 dark:to-slate-600 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Para confirmar
        </button>
        <button
          onClick={() => setActiveSubTab('ready')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            activeSubTab === 'ready'
              ? 'bg-gradient-to-br from-white/60 to-slate-100/60 text-slate-900 shadow-sm backdrop-blur-sm dark:from-slate-700 dark:to-slate-600 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Listas para entregar
        </button>
      </div>

      {activeSubTab === 'paid' ? (
        <OrderList orders={paidOrders} status="PAID" />
      ) : (
        <OrderList orders={readyOrders} status="READY" />
      )}
    </div>
  )
}
