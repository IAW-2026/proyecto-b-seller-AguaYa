import React, { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getVendorByUserId } from '@/lib/queries/vendors'
import { listAllOrdersPaginated } from '@/lib/queries/orders'
import { getAuthRoles } from '@/lib/auth-utils'
import AdminOrdersTable from '@/components/admin/AdminOrdersTable'
import OrdersList from '@/components/orders/OrdersList'
import RefreshButton from '@/components/orders/RefreshButton'
import AutoRefresh from '@/lib/AutoRefresh'
import OrderNotifier from '@/components/orders/OrderNotifier'
import { Package } from 'lucide-react'

async function OrdersContent(props: { searchParams: Promise<{ page?: string; paid_page?: string; ready_page?: string }> }) {
  const { userId } = await auth()
  if (!userId) return null

  const roles = await getAuthRoles()
  const isAdmin = roles.includes('admin_seller')
  const searchParams = await props.searchParams

  if (isAdmin) {
    const page = parseInt(searchParams.page || '1', 10)
    const result = await listAllOrdersPaginated(page)
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Órdenes</h1>
        </div>
        <AdminOrdersTable orders={result.items} page={page} pageCount={result.pageCount} />
      </div>
    )
  }

  const vendor = await getVendorByUserId(userId)
  if (!vendor) redirect('/setup-vendor')

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
      <OrderNotifier interval={10000} />
    </div>
  )
}

export default async function OrdersPage(props: { searchParams: Promise<{ page?: string; paid_page?: string; ready_page?: string }> }) {
  return (
    <Suspense fallback={<div className="text-center py-8 text-slate-500">Cargando órdenes...</div>}>
      <OrdersContent searchParams={props.searchParams} />
    </Suspense>
  )
}
