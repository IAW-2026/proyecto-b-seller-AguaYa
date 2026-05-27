import React from 'react'
import { redirect } from 'next/navigation'
import { getAuthRoles } from '@/lib/auth-utils'
import { listAllProductsPaginated } from '@/lib/queries'
import AdminProductsTable from '@/components/admin/AdminProductsTable'

export default async function AdminProductsPage(props: { searchParams: Promise<{ page?: string }> }) {
  const roles = await getAuthRoles()
  if (!roles.includes('admin_seller')) redirect('/dashboard/overview')

  const searchParams = await props.searchParams
  const page = parseInt(searchParams.page || '1', 10)
  const result = await listAllProductsPaginated(page)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Productos (global)</h1>
      </div>
      <AdminProductsTable products={result.items as any[]} page={page} pageCount={result.pageCount} />
    </div>
  )
}
