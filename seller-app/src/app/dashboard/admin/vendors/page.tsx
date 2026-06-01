import React, { Suspense } from 'react'
import Link from 'next/link'
import { requireAdminPage } from '@/lib/admin-guard'
import { getVendorsWithClerkInfoPaginated } from '@/app/actions/admin-vendor'
import SearchBar from '@/components/ui/SearchBar'
import AdminVendorsTable from '@/components/admin/AdminVendorsTable'
import DashboardTableLoading from '@/components/ui/DashboardTableLoading'

async function VendorsTable(props: { searchParams: Promise<{ page?: string; q?: string; sortBy?: string; sortOrder?: string }> }) {
  const searchParams = await props.searchParams
  const page = parseInt(searchParams.page || '1', 10)
  const q = searchParams.q || ''
  const sortBy = searchParams.sortBy || ''
  const sortOrder = searchParams.sortOrder || ''

  const { items: vendors, pageCount } = await getVendorsWithClerkInfoPaginated(page, {
    q: q || undefined,
    sortBy: sortBy || undefined,
    sortOrder: sortOrder || undefined,
  })

  return <AdminVendorsTable vendors={vendors} page={page} pageCount={pageCount} />
}

export default async function VendorsPage(props: { searchParams: Promise<{ page?: string; q?: string; sortBy?: string; sortOrder?: string }> }) {
  await requireAdminPage()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vendedores</h1>
        <Link
          href="/dashboard/admin/vendors/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-700"
        >
          Nuevo vendedor
        </Link>
      </div>

      <div className="mb-4">
        <SearchBar placeholder="Buscar por nombre, email o CUIL/CUIT..." />
      </div>

      <Suspense fallback={<DashboardTableLoading />}>
        <VendorsTable searchParams={props.searchParams} />
      </Suspense>
    </div>
  )
}
