import React, { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getVendorByUserId } from '@/lib/queries/vendors'
import { getVendorOrdersByStatus } from '@/lib/queries/orders'
import OrdersTabs from '@/components/orders/OrdersTabs'
import RefreshButton from '@/components/orders/RefreshButton'
import AutoRefresh from '@/lib/AutoRefresh'
import OrderNotifier from '@/components/orders/OrderNotifier'
import OrdersLoading from '@/components/ui/loadings/OrdersLoading'
import { Package } from 'lucide-react'

export default function VendorOrdersPage(props: { searchParams: Promise<{ paid_page?: string; ready_page?: string }> }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Órdenes</h1>
            <p className="text-gray-600 dark:text-slate-400">Gestiona tus pedidos entrantes</p>
          </div>
        </div>
        <RefreshButton />
      </div>

      <Suspense fallback={<OrdersLoading />}>
        <VendorOrdersContent searchParams={props.searchParams} />
      </Suspense>
      <AutoRefresh interval={10000} />
      <OrderNotifier interval={10000} />
    </div>
  )
}

async function VendorOrdersContent({ searchParams }: { searchParams: Promise<{ paid_page?: string; ready_page?: string }> }) {
  const { userId } = await auth()
  if (!userId) return null

  const vendor = await getVendorByUserId(userId)
  if (!vendor) redirect('/setup-vendor')

  const params = await searchParams
  const paidPage = Math.max(1, parseInt(params.paid_page || '1', 10))
  const readyPage = Math.max(1, parseInt(params.ready_page || '1', 10))

  let paidResult: Awaited<ReturnType<typeof getVendorOrdersByStatus>> | null = null
  let readyResult: Awaited<ReturnType<typeof getVendorOrdersByStatus>> | null = null
  let error: string | null = null

  try {
    const [pr, rr] = await Promise.all([
      getVendorOrdersByStatus(vendor.id, 'PAID', paidPage),
      getVendorOrdersByStatus(vendor.id, 'READY', readyPage),
    ])
    paidResult = pr
    readyResult = rr
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error al cargar órdenes'
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
        <p className="font-semibold">Error: {error}</p>
      </div>
    )
  }

  if (!paidResult || !readyResult) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">
        <Package className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-slate-600" />
        <p className="text-lg">No hay órdenes aún</p>
        <p className="text-sm dark:text-slate-400">Las órdenes que recibas aparecerán aquí</p>
      </div>
    )
  }

  return (
    <OrdersTabs
      vendorId={vendor.id}
      paidOrders={paidResult.items}
      paidPage={paidPage}
      paidPageCount={paidResult.pageCount}
      paidTotal={paidResult.total}
      readyOrders={readyResult.items}
      readyPage={readyPage}
      readyPageCount={readyResult.pageCount}
      readyTotal={readyResult.total}
    />
  )
}
