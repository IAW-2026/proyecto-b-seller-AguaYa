'use client'

import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import type { Order, Paginated } from '@/lib/types'
import OrderList from './OrderList'

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
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        <button
          onClick={() => setActiveSubTab('paid')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            activeSubTab === 'paid'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Para confirmar
        </button>
        <button
          onClick={() => setActiveSubTab('ready')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            activeSubTab === 'ready'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
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
