'use client'

import { useRouter } from 'next/navigation'
import Pagination from '@/components/Pagination'
import ProductFormDialog from '@/components/products/ProductFormDialog'

interface Product {
  id: string
  name: string
  price: number
  stock: number
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
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.vendor.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.stock}</td>
                  <td className="px-4 py-3">
                    <ProductFormDialog
                      mode="edit"
                      productId={p.id}
                      vendorId={p.vendor.id}
                      initialData={{ name: p.name, price: p.price, stock: p.stock }}
                    >
                      <span className="rounded-lg border border-sky-600 px-3 py-1 text-xs font-medium text-sky-600 transition hover:bg-sky-600 hover:text-white cursor-pointer dark:border-sky-400 dark:text-sky-400 dark:hover:bg-sky-500 dark:hover:text-white">Editar</span>
                    </ProductFormDialog>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} onPageChange={(p) => router.push(`/dashboard/admin/products?page=${p}`)} />
    </div>
  )
}
