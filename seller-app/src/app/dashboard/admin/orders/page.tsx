/**
 * Página de órdenes globales del panel de administración.
 * Lista paginada y filtrable de todas las órdenes del sistema.
 */
import React, { Suspense } from 'react'
import { requireAdminPage } from '@/lib/admin-guard'
import { listAllOrdersPaginated } from '@/lib/queries/orders'
import AdminOrdersTable from '@/components/admin/AdminOrdersTable'
import AdminOrdersLoading from '@/components/ui/admin-loadings/AdminOrdersLoading'

async function OrdersTable(props: { searchParams: Promise<{ page?: string; q?: string; from?: string; to?: string; status?: string }> }) {
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

/** Página de órdenes globales del panel de administración. */
export default async function AdminOrdersPage(props: { searchParams: Promise<{ page?: string; q?: string; from?: string; to?: string; status?: string }> }) {
  await requireAdminPage()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Órdenes (global)</h1>
      </div>
      <Suspense fallback={<AdminOrdersLoading />}>
        <OrdersTable searchParams={props.searchParams} />
      </Suspense>
    </div>
  )
}
