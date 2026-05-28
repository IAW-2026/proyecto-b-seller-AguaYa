'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProductAsAdmin, deleteProductAsAdmin } from '@/app/actions/admin-vendor'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  vendor: { id: string; name: string }
}

export default function EditableProductRow({ product }: { product: Product }) {
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: product.name, price: product.price, stock: product.stock })
  const router = useRouter()

  async function save() {
    await updateProductAsAdmin(product.vendor.id, product.id, editForm)
    setEditing(false)
    router.refresh()
  }

  async function remove() {
    if (confirm(`¿Eliminar "${product.name}"?`)) {
      await deleteProductAsAdmin(product.vendor.id, product.id)
      router.refresh()
    }
  }

  if (editing) {
    return (
      <tr className="hover:bg-slate-50">
        <td className="px-4 py-3">
          <input
            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
        </td>
        <td className="px-4 py-3 text-slate-600">{product.vendor.name}</td>
        <td className="px-4 py-3">
          <input
            className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
            type="number"
            step="0.01"
            value={editForm.price}
            onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
          />
        </td>
        <td className="px-4 py-3">
          <input
            className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
            type="number"
            value={editForm.stock}
            onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })}
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <button onClick={save} className="rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700">
              Guardar
            </button>
            <button onClick={() => setEditing(false)} className="rounded bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300">
              Cancelar
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3 font-medium text-slate-900">{product.name}</td>
      <td className="px-4 py-3 text-slate-600">{product.vendor.name}</td>
      <td className="px-4 py-3 text-slate-600">${product.price.toFixed(2)}</td>
      <td className="px-4 py-3 text-slate-600">{product.stock}</td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)} className="rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700">
            Editar
          </button>
          <button onClick={remove} className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700">
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  )
}
