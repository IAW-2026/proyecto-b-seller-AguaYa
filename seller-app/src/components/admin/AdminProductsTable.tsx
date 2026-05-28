'use client'

import { useRouter } from 'next/navigation'
import EditableProductRow from '@/components/admin/EditableProductRow'
import Pagination from '@/components/Pagination'

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
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Vendedor</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  No hay productos registrados.
                </td>
              </tr>
            ) : (
              products.map((p) => <EditableProductRow key={p.id} product={p} />)
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} onPageChange={(p) => router.push(`/dashboard/admin/products?page=${p}`)} />
    </div>
  )
}
