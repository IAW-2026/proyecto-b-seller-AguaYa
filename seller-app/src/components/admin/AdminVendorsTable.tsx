'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import Link from 'next/link'
import SortIcon from '@/components/admin/SortIcon'
import ToggleVendorButton from '@/components/vendors/ToggleVendorButton'
import AdminVendorEditDialog from '@/components/admin/AdminVendorEditDialog'
import Pagination from '@/components/Pagination'
import { Package } from 'lucide-react'

const SORTABLE_COLS = ['name', 'isActive', 'createdAt'] as const
type SortCol = (typeof SORTABLE_COLS)[number]

interface VendorRow {
  id: string
  name: string
  address: string
  description: string | null
  image: string | null
  isActive: boolean
  createdAt: Date
  clerkName: string
  clerkEmail: string
  cuil: string | null
  cuit: string | null
}

export default function AdminVendorsTable({
  vendors,
  page,
  pageCount,
}: {
  vendors: VendorRow[]
  page: number
  pageCount: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const sortBy = searchParams.get('sortBy')
  const sortOrder = searchParams.get('sortOrder')

  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v)
        else params.delete(k)
      }
      params.delete('page')
      const str = params.toString()
      router.push(str ? `${pathname}?${str}` : pathname)
    },
    [router, pathname, searchParams]
  )

  function handleSort(col: SortCol) {
    if (sortBy === col && sortOrder === 'asc') {
      pushParams({ sortBy: col, sortOrder: 'desc' })
    } else if (sortBy === col && sortOrder === 'desc') {
      pushParams({ sortBy: '', sortOrder: '' })
    } else {
      pushParams({ sortBy: col, sortOrder: 'asc' })
    }
  }

  const thClass = 'px-4 py-3 font-medium cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors'
  const activeSortClass = 'text-slate-900 dark:text-slate-100'

  if (vendors.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 dark:text-slate-500">
        <Package className="mx-auto mb-4 h-10 w-10" />
        <p>No hay vendedores registrados.</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th onClick={() => handleSort('name')} className={`${thClass} ${sortBy === 'name' ? activeSortClass : ''}`}>
                Vendedor<SortIcon col="name" sortBy={sortBy} sortOrder={sortOrder} />
              </th>
              <th onClick={() => handleSort('isActive')} className={`${thClass} ${sortBy === 'isActive' ? activeSortClass : ''}`}>
                Estado<SortIcon col="isActive" sortBy={sortBy} sortOrder={sortOrder} />
              </th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">CUIL / CUIT</th>
              <th onClick={() => handleSort('createdAt')} className={`${thClass} ${sortBy === 'createdAt' ? activeSortClass : ''}`}>
                Creado<SortIcon col="createdAt" sortBy={sortBy} sortOrder={sortOrder} />
              </th>
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
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    vendor.isActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${vendor.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {vendor.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{vendor.clerkEmail || '-'}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{vendor.cuil || vendor.cuit || '-'}</td>
                <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                  {new Date(vendor.createdAt).toLocaleDateString('es-ES', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <AdminVendorEditDialog vendor={vendor} />
                    <ToggleVendorButton vendorId={vendor.id} isActive={vendor.isActive} vendorName={vendor.name} role="admin" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageCount={pageCount}
        onPageChange={(p) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set('page', String(p))
          router.push(`${pathname}?${params.toString()}`)
        }}
      />
    </>
  )
}
