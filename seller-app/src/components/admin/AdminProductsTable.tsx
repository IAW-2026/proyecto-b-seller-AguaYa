'use client'

import { useRouter } from 'next/navigation'
import Pagination from '@/components/Pagination'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  isActive: boolean
  vendor: { id: string; name: string }
}

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

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Vendedor</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
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
                  <td className="px-4 py-3"></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-6">
        <Pagination page={page} pageCount={pageCount} onPageChange={(p) => router.push(`/dashboard/admin/products?page=${p}`)} />
      </div>
    </div>
  )
}
