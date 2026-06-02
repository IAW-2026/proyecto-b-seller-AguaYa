/**
 * Página principal de órdenes del dashboard.
 * Renderiza la vista de administrador (tabla global) o la del vendedor (lista segmentada).
 */
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
import DashboardTableLoading from '@/components/ui/DashboardTableLoading'
import { Package } from 'lucide-react'

async function AdminOrdersContent(props: { searchParams: Promise<{ page?: string; q?: string; from?: string; to?: string; status?: string }> }) {
  const searchParams = await props.searchParams
  const page = parseInt(searchParams.page || '1', 10)
  const q = searchParams.q || ''
  const from = searchParams.from || ''
  const to = searchParams.to || ''
  const status = searchParams.status || ''

  const result = await listAllOrdersPaginated(page, {
    q: q || undefined,
    from: from || undefined,
    to: to || undefined,
    status: status || undefined,
  })

  return <AdminOrdersTable orders={result.items} page={page} pageCount={result.pageCount} />
}

/** Página de órdenes: vista admin (global) o vendedor (segmentada por estado). */
export default async function OrdersPage(props: { searchParams: Promise<{ page?: string; paid_page?: string; ready_page?: string; q?: string; from?: string; to?: string; status?: string }> }) {
  const { userId } = await auth()
  if (!userId) return null

  const roles = await getAuthRoles()
  const isAdmin = roles.includes('admin_seller')

  if (isAdmin) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Órdenes</h1>
        </div>
        <Suspense fallback={<DashboardTableLoading />}>
          <AdminOrdersContent searchParams={props.searchParams} />
        </Suspense>
      </div>
    )
  }

  const vendor = await getVendorByUserId(userId)
  if (!vendor) redirect('/setup-vendor')

  const searchParams = await props.searchParams
  const paidPage = parseInt(searchParams.paid_page || '1', 10)
  const readyPage = parseInt(searchParams.ready_page || '1', 10)
  const q = searchParams.q || ''
  const from = searchParams.from || ''
  const to = searchParams.to || ''

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

      <Suspense fallback={<DashboardTableLoading />}>
        <OrdersList paidPage={paidPage} readyPage={readyPage} q={q} from={from} to={to} />
      </Suspense>
      <AutoRefresh interval={10000} />
      <OrderNotifier interval={10000} />
    </div>
  )
}
