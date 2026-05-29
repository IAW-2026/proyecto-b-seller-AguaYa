import React from 'react'
import Link from 'next/link'
import { requireAdminPage } from '@/lib/admin-guard'
import { getVendorsWithClerkInfoPaginated } from '@/app/actions/admin-vendor'
import DeleteVendorButton from '@/components/admin/DeleteVendorButton'
import VendorsPagination from '@/components/admin/VendorsPagination'
import AdminVendorEditDialog from '@/components/admin/AdminVendorEditDialog'
import { Package } from 'lucide-react'

export default async function VendorsPage(props: { searchParams: Promise<{ page?: string }> }) {
  await requireAdminPage()

  const searchParams = await props.searchParams
  const page = parseInt(searchParams.page || '1', 10)
  const { items: vendors, pageCount } = await getVendorsWithClerkInfoPaginated(page)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vendedores</h1>
        <Link
          href="/dashboard/admin/vendors/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Nuevo vendedor
        </Link>
      </div>

      {vendors.length === 0 ? (
        <div className="p-12 text-center text-slate-400 dark:text-slate-500">
          <Package className="mx-auto mb-4 h-10 w-10" />
          <p>No hay vendedores registrados.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Vendedor</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">CUIL / CUIT</th>
                  <th className="px-4 py-3 font-medium">Creado</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/admin/vendors/${vendor.id}`}
                        className="font-medium text-sky-700 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
                      >
                        {vendor.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{vendor.clerkEmail || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{vendor.cuil || vendor.cuit || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 flex items-center gap-3">
                      <AdminVendorEditDialog vendor={vendor} />
                      <DeleteVendorButton vendorId={vendor.id} vendorName={vendor.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <VendorsPagination page={page} pageCount={pageCount} />
        </>
      )}
    </div>
  )
}
