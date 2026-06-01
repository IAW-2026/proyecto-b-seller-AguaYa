import React, { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getVendorByUserId, getVendorProducts } from '@/lib/queries/vendors'
import { listAllProductsPaginated } from '@/lib/queries/products'
import { getAuthRoles } from '@/lib/auth-utils'
import AdminProductsTable from '@/components/admin/AdminProductsTable'
import DashboardTableLoading from '@/components/ui/DashboardTableLoading'
import DashboardLoading from '@/components/ui/DashboardLoading'
import ProductCard from '@/components/products/ProductCard'
import ProductFormDialog from '@/components/products/ProductFormDialog'

async function AdminProductsContent({ searchParams }: { searchParams: Awaited<{ page?: string; q?: string; isActive?: string; sortBy?: string; sortOrder?: string }> }) {
  const page = parseInt(searchParams.page || '1', 10)
  const q = searchParams.q || ''
  const isActive = searchParams.isActive === 'true' ? true : searchParams.isActive === 'false' ? false : undefined
  const sortBy = searchParams.sortBy || ''
  const sortOrder = searchParams.sortOrder || ''

  const result = await listAllProductsPaginated(page, { q, isActive, sortBy: sortBy || undefined, sortOrder: sortOrder || undefined })
  return <AdminProductsTable products={result.items} page={page} pageCount={result.pageCount} />
}

export default async function ProductsPage(props: { searchParams: Promise<{ page?: string; q?: string; isActive?: string; sortBy?: string; sortOrder?: string }> }) {
  const { userId } = await auth()
  if (!userId) return null

  const roles = await getAuthRoles()
  const isAdmin = roles.includes('admin_seller')
  const searchParams = await props.searchParams

  if (isAdmin) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Productos</h1>
        </div>
        <Suspense fallback={<DashboardTableLoading />}>
          <AdminProductsContent searchParams={searchParams} />
        </Suspense>
      </div>
    )
  }

  const vendor = await getVendorByUserId(userId)
  if (!vendor) redirect('/setup-vendor')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Catálogo de productos</h1>
        </div>
        <ProductFormDialog>
          <button type="button" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
            + Nuevo producto
          </button>
        </ProductFormDialog>
      </div>

      <Suspense fallback={<DashboardLoading />}>
        <VendorProductsContent vendorId={vendor.id} />
      </Suspense>
    </div>
  )
}

async function VendorProductsContent({ vendorId }: { vendorId: string }) {
  const productsVendor = await getVendorProducts(vendorId)

  if (!productsVendor) {
    return (
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Productos</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">No existe un vendedor asociado a esta cuenta.</h1>
        <p className="text-slate-600">Registrá tu negocio primero para empezar a administrar el catálogo.</p>
        <Link className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800" href="/setup-vendor">Registrar negocio</Link>
      </div>
    )
  }

  if (productsVendor.products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-slate-600 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-400">No tienes productos aún.</p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {productsVendor.products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
