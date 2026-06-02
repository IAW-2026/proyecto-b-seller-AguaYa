/**
 * Tab de productos de un vendedor con tabla paginada y enlace a edición.
 */
'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Package } from 'lucide-react'
import type { Product, Paginated } from '@/lib/types'
import ProductFormDialog from '@/components/products/ProductFormDialog'
import Pagination from '@/components/Pagination'

/** Tabla paginada de productos del vendedor con opción de edición. */
export default function ProductsTab({ vendorId, products }: { vendorId: string; products: Paginated<Product> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('product_page', String(page))
    return `${pathname}?${params.toString()}`
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Productos ({products.items.length})
        </h3>
      </div>

      {products.items.length === 0 ? (
        <div className="p-12 text-center text-slate-400 dark:text-slate-500">
          <Package className="mx-auto mb-4 h-10 w-10" />
          <p>No hay productos.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {products.items.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{product.name}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">${product.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{product.stock}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ProductFormDialog
                        mode="edit"
                        productId={product.id}
                        initialData={{
                          name: product.name,
                          description: product.description || undefined,
                          price: product.price,
                          stock: product.stock,
                          image: product.image || undefined,
                        }}
                        vendorId={vendorId}
                      >
                        <button className="rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-sky-50 dark:border-sky-700 dark:text-sky-400 dark:hover:bg-sky-900/20">
                          Editar
                        </button>
                      </ProductFormDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {products.pageCount > 1 && (
        <div className="mt-4">
          <Pagination
            page={products.page}
            pageCount={products.pageCount}
            onPageChange={(p) => router.push(buildPageUrl(p))}
          />
        </div>
      )}
    </div>
  )
}
