import React, { Suspense } from 'react'
import OrdersList from '@/components/orders/OrdersList'
import RefreshButton from '@/components/orders/RefreshButton'
import AutoRefresh from '@/lib/AutoRefresh'
import { Package } from 'lucide-react'

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
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
        <OrdersList />
      </Suspense>
      <AutoRefresh interval={10000} />
    </div>
  )
}
