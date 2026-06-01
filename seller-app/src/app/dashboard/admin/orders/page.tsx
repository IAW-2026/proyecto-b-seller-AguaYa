import React, { Suspense } from 'react'
import { requireAdminPage } from '@/lib/admin-guard'
import { listAllOrdersPaginated } from '@/lib/queries/orders'
import AdminOrdersTable from '@/components/admin/AdminOrdersTable'

export default async function AdminOrdersPage(props: { searchParams: Promise<{ page?: string; q?: string; from?: string; to?: string; status?: string }> }) {
  await requireAdminPage()

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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Órdenes (global)</h1>
      </div>
      <Suspense fallback={<div className="text-center py-8 text-slate-500 dark:text-slate-400">Cargando...</div>}>
        <AdminOrdersTable orders={result.items} page={page} pageCount={result.pageCount} />
      </Suspense>
    </div>
  )
}
