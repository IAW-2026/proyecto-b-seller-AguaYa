import React from 'react'
import Link from 'next/link'
import { requireAdminPage } from '@/lib/admin-guard'
import { getVendorsWithClerkInfoPaginated } from '@/app/actions/admin-vendor'
import DeleteVendorButton from '@/components/admin/DeleteVendorButton'
import VendorsPagination from '@/components/admin/VendorsPagination'
import { Package } from 'lucide-react'

export default async function VendorsPage(props: { searchParams: Promise<{ page?: string }> }) {
  await requireAdminPage()

  const searchParams = await props.searchParams
  const page = parseInt(searchParams.page || '1', 10)
  const { items: vendors, pageCount } = await getVendorsWithClerkInfoPaginated(page)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Vendedores</h1>
        <Link
          href="/dashboard/admin/vendors/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Nuevo vendedor
        </Link>
      </div>

      {vendors.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <Package className="mx-auto mb-4 h-10 w-10" />
          <p>No hay vendedores registrados.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Vendedor</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Reseñas</th>
                  <th className="px-4 py-3 font-medium">CUIL / CUIT</th>
                  <th className="px-4 py-3 font-medium">Creado</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/admin/vendors/${vendor.id}`}
                        className="font-medium text-sky-700 hover:text-sky-500"
                      >
                        {vendor.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{vendor.clerkEmail || '-'}</td>
                    <td className="px-4 py-3">
                      {vendor.totalReviews > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-500" title={`${vendor.promedio} de 5 estrellas`}>
                          <span className="text-slate-700">{'★'.repeat(Math.round(vendor.promedio))}{'☆'.repeat(5 - Math.round(vendor.promedio))}</span>
                          <span className="text-xs text-slate-400">({vendor.totalReviews})</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Sin reseñas</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{vendor.cuil || vendor.cuit || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
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
