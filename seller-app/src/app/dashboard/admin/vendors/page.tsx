import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthRoles } from '@/lib/auth-utils'
import { getVendorsWithClerkInfo } from '@/app/actions/admin-vendor'
import DeleteVendorButton from '@/components/admin/DeleteVendorButton'

export default async function VendorsPage() {
  const roles = await getAuthRoles()
  if (!roles.includes('admin_seller')) redirect('/dashboard/overview')

  const vendors = await getVendorsWithClerkInfo()

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

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Vendedor</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">CUIL / CUIT</th>
              <th className="px-4 py-3 font-medium">Creado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  No hay vendedores registrados.
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
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
                  <td className="px-4 py-3 text-slate-600">{vendor.cuil || vendor.cuit || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteVendorButton vendorId={vendor.id} vendorName={vendor.name} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
