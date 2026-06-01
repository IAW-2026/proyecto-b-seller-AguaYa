import React from 'react'
import { requireAdminPage } from '@/lib/admin-guard'
import { listAllProductsPaginated } from '@/lib/queries/products'
import AdminProductsTable from '@/components/admin/AdminProductsTable'

export default async function AdminProductsPage(props: { searchParams: Promise<{ page?: string }> }) {
  await requireAdminPage()

  const searchParams = await props.searchParams
  const page = parseInt(searchParams.page || '1', 10)
  const result = await listAllProductsPaginated(page)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Productos (global)</h1>
      </div>
      <AdminProductsTable products={result.items} page={page} pageCount={result.pageCount} />
    </div>
  )
}
