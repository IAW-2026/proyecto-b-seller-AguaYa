/**
 * Tabla paginada y ordenable de productos globales para el panel de administración.
 * Permite filtrar por estado y buscar por producto o vendedor.
 */
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/ui/SearchBar'
import { Pencil } from 'lucide-react'
import ProductFormDialog from '@/components/products/ProductFormDialog'
import SortIcon from '@/components/admin/SortIcon'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  createdAt: Date
  isActive: boolean
  description?: string | null
  image?: string | null
  vendor: { id: string; name: string }
}

const SORTABLE_COLS = ['name', 'vendor', 'price', 'stock', 'createdAt'] as const
type SortCol = (typeof SORTABLE_COLS)[number]

/** Tabla de productos global con filtros, búsqueda y ordenamiento. */
export default function AdminProductsTable({
  products,
  page,
  pageCount,
}: {
  products: Product[]
  page: number
  pageCount: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const sortBy = searchParams.get('sortBy')
  const sortOrder = searchParams.get('sortOrder')
  const isActive = searchParams.get('isActive')


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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <SearchBar placeholder="Buscar por producto o vendedor..." />
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit dark:bg-slate-800">
        {[
          { key: '', label: 'Todos' },
          { key: 'true', label: 'Activos' },
          { key: 'false', label: 'Inactivos' },
        ].map((opt) => {
          const active = (isActive || '') === opt.key
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => pushParams({ isActive: opt.key })}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[70vh] rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th onClick={() => handleSort('name')} className={`${thClass} ${sortBy === 'name' ? activeSortClass : ''}`}>
                Producto<SortIcon col="name" sortBy={sortBy} sortOrder={sortOrder} />
              </th>
              <th onClick={() => handleSort('vendor')} className={`${thClass} ${sortBy === 'vendor' ? activeSortClass : ''}`}>
                Vendedor<SortIcon col="vendor" sortBy={sortBy} sortOrder={sortOrder} />
              </th>
              <th onClick={() => handleSort('price')} className={`${thClass} ${sortBy === 'price' ? activeSortClass : ''}`}>
                Precio<SortIcon col="price" sortBy={sortBy} sortOrder={sortOrder} />
              </th>
              <th onClick={() => handleSort('stock')} className={`${thClass} ${sortBy === 'stock' ? activeSortClass : ''}`}>
                Stock<SortIcon col="stock" sortBy={sortBy} sortOrder={sortOrder} />
              </th>
              <th onClick={() => handleSort('createdAt')} className={`${thClass} ${sortBy === 'createdAt' ? activeSortClass : ''}`}>
                Creado<SortIcon col="createdAt" sortBy={sortBy} sortOrder={sortOrder} />
              </th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                  No hay productos registrados.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.vendor.name}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{p.stock}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-500">
                    {new Date(p.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {p.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ProductFormDialog
                      mode="edit"
                      productId={p.id}
                      vendorId={p.vendor.id}
                      initialData={{
                        name: p.name,
                        description: p.description || undefined,
                        price: p.price,
                        stock: p.stock,
                        image: p.image || undefined,
                      }}
                      disableRedirect
                    >
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors"
                        title="Editar producto"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </ProductFormDialog>
                  </td>
                </tr>
              ))
            )}
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
    </div>
  )
}
