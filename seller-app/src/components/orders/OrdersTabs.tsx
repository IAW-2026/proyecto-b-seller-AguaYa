'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Pagination from '@/components/Pagination'
import { Package } from 'lucide-react'
import OrderCard from '@/components/orders/OrderCard'
import type { OrderWithItems } from '@/components/orders/OrderCard'

type TabId = 'confirm' | 'ready'

const TABS: { id: TabId; label: string }[] = [
  { id: 'confirm', label: 'Para confirmar' },
  { id: 'ready', label: 'Listas para entregar' },
]

export default function OrdersTabs({
  paidOrders,
  paidPage,
  paidPageCount,
  paidTotal,
  readyOrders,
  readyPage,
  readyPageCount,
  readyTotal,
}: {
  paidOrders: OrderWithItems[]
  paidPage: number
  paidPageCount: number
  paidTotal: number
  readyOrders: OrderWithItems[]
  readyPage: number
  readyPageCount: number
  readyTotal: number
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
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit dark:bg-slate-800">
        {TABS.map((tab) => {
          const count = tab.id === 'confirm' ? paidTotal : readyTotal
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      {currentOrders.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">
          <Package className="mx-auto mb-4 h-10 w-10 text-gray-300 dark:text-slate-600" />
          <p className="text-base">
            {activeTab === 'confirm'
              ? 'No hay órdenes pendientes'
              : 'No hay órdenes listas para entregar'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
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
