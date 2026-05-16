import React, { Suspense } from 'react'
import OrdersList from '@/components/orders/OrdersList'
import AutoRefresh from '@/lib/AutoRefresh'
import { Package } from 'lucide-react'

export const metadata = {
  title: 'Órdenes | Dashboard',
  description: 'Gestiona tus órdenes y pedidos',
}

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Package className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Órdenes</h1>
          <p className="text-gray-600">Gestiona tus pedidos entrantes</p>
        </div>
      </div>

      {/* Orders List with Suspense */}
      <Suspense
        fallback={
          <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-slate-900" />
            <p className="mt-4 text-slate-600">Cargando órdenes...</p>
          </div>
        }
      >
        <AutoRefresh>
          <OrdersList />
        </AutoRefresh>
      </Suspense>
    </div>
  )
}
