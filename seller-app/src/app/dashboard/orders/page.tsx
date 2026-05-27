import React, { Suspense } from 'react'
import OrdersList from '@/components/orders/OrdersList'
import RefreshButton from '@/components/orders/RefreshButton'
import AutoRefresh from '@/lib/AutoRefresh'
import { Package } from 'lucide-react'

export default async function OrdersPage(props: { searchParams: Promise<{ paid_page?: string; ready_page?: string }> }) {
  const searchParams = await props.searchParams
  const paidPage = parseInt(searchParams.paid_page || '1', 10)
  const readyPage = parseInt(searchParams.ready_page || '1', 10)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Órdenes</h1>
            <p className="text-gray-600">Gestiona tus pedidos entrantes</p>
          </div>
        </div>
        <RefreshButton />
      </div>

      <Suspense fallback={<div className="text-center py-8 text-slate-500">Cargando órdenes...</div>}>
        <OrdersList paidPage={paidPage} readyPage={readyPage} />
      </Suspense>
      <AutoRefresh interval={10000} />
    </div>
  )
}
