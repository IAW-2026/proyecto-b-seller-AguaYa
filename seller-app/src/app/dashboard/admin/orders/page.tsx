import React from 'react'
import { redirect } from 'next/navigation'
import { getAuthRoles } from '@/lib/auth-utils'
import { listAllOrdersPaginated } from '@/lib/queries'
import AdminOrdersTable from '@/components/admin/AdminOrdersTable'

export default async function AdminOrdersPage(props: { searchParams: Promise<{ page?: string }> }) {
  const roles = await getAuthRoles()
  if (!roles.includes('admin_seller')) redirect('/dashboard/overview')

  const searchParams = await props.searchParams
  const page = parseInt(searchParams.page || '1', 10)
  const result = await listAllOrdersPaginated(page)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Órdenes (global)</h1>
      </div>
      <AdminOrdersTable orders={result.items as any[]} page={page} pageCount={result.pageCount} />
    </div>
  )
}
