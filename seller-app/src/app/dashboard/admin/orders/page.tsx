import React from 'react'
import { requireAdminPage } from '@/lib/admin-guard'
import { listAllOrdersPaginated } from '@/lib/queries/orders'
import AdminOrdersTable from '@/components/admin/AdminOrdersTable'

export default async function AdminOrdersPage(props: { searchParams: Promise<{ page?: string }> }) {
  await requireAdminPage()

  const searchParams = await props.searchParams
  const page = parseInt(searchParams.page || '1', 10)
  const result = await listAllOrdersPaginated(page)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Órdenes (global)</h1>
      </div>
      <AdminOrdersTable orders={result.items} page={page} pageCount={result.pageCount} />
    </div>
  )
}
