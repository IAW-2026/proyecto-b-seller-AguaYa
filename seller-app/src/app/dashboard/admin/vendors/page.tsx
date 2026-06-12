/**
 * Página de listado de vendedores del panel de administración.
 * Permite buscar, filtrar y paginar vendedores, y acceder al formulario de creación.
 */
import React, { Suspense } from 'react'
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

/** Página de listado de vendedores con búsqueda y paginación. */
export default async function VendorsPage(props: { searchParams: Promise<{ page?: string; q?: string; sortBy?: string; sortOrder?: string }> }) {
  await requireAdminPage()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Vendedores</h1>

      <div className="mb-4">
        <SearchBar placeholder="Buscar por nombre, email o CUIL/CUIT..." />
      </div>

      <Suspense fallback={<DashboardTableLoading />}>
        <VendorsTable searchParams={props.searchParams} />
      </Suspense>
    </div>
  )
}
