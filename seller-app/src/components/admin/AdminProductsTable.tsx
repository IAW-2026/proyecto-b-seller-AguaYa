'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProductAsAdmin, deleteProductAsAdmin } from '@/app/actions/admin-vendor'
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', price: 0, stock: 0 })

  function startEdit(p: Product) {
    setEditingId(p.id)
    setEditForm({ name: p.name, price: p.price, stock: p.stock })
  }

  async function saveEdit(vendorId: string, productId: string) {
    await updateProductAsAdmin(vendorId, productId, editForm)
    setEditingId(null)
    router.refresh()
  }

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
              products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {editingId === p.id ? (
                      <input
                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    ) : (
                      p.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.vendor.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {editingId === p.id ? (
                      <input
                        className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                        type="number"
                        step="0.01"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                      />
                    ) : (
                      `$${p.price.toFixed(2)}`
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {editingId === p.id ? (
                      <input
                        className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                        type="number"
                        value={editForm.stock}
                        onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })}
                      />
                    ) : (
                      p.stock
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {editingId === p.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(p.vendor.id, p.id)}
                            className="rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(p)}
                            className="rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700"
                          >
                            Editar
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`¿Eliminar "${p.name}"?`)) {
                                await deleteProductAsAdmin(p.vendor.id, p.id)
                                router.refresh()
                              }
                            }}
                            className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
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
