import React, { Suspense } from 'react'
import { requireAdminPage } from '@/lib/admin-guard'
import { listAllProductsPaginated } from '@/lib/queries/products'
import AdminProductsTable from '@/components/admin/AdminProductsTable'

export default async function AdminProductsPage(props: { searchParams: Promise<{ page?: string; q?: string; isActive?: string; sortBy?: string; sortOrder?: string }> }) {
  await requireAdminPage()

  const searchParams = await props.searchParams
  const page = parseInt(searchParams.page || '1', 10)
  const q = searchParams.q || ''
  const isActive = searchParams.isActive === 'true' ? true : searchParams.isActive === 'false' ? false : undefined
  const sortBy = searchParams.sortBy || ''
  const sortOrder = searchParams.sortOrder || ''

  const result = await listAllProductsPaginated(page, { q, isActive, sortBy: sortBy || undefined, sortOrder: sortOrder || undefined })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Productos (global)</h1>
      </div>
      <Suspense fallback={<div className="text-center py-8 text-slate-500 dark:text-slate-400">Cargando...</div>}>
        <AdminProductsTable products={result.items} page={page} pageCount={result.pageCount} />
      </Suspense>
    </div>
  )
}
