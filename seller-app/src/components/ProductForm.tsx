'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, deleteProduct, updateProduct } from '@/app/actions/product'
import Button from './ui/Button'
import ImageUpload from './ui/ImageUpload'
import { validateProductInput } from '../lib/validation'

interface ProductFormProps {
  mode?: 'create' | 'edit'
  productId?: string
  initialData?: {
    name: string
    description?: string
    price?: number
    stock?: number
    image?: string
  }
}

export default function ProductForm({ mode = 'create', productId, initialData }: ProductFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price?.toString() || '',
    stock: initialData?.stock?.toString() || '',
    image: initialData?.image || '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = validateProductInput({
        name: form.name,
        description: form.description,
        price: form.price,
        stock: form.stock,
        image: form.image,
      })

      if (mode === 'edit') {
        if (!productId) {
          throw new Error('Falta el identificador del producto')
        }

        await updateProduct({ id: productId, ...payload })
      } else {
        await createProduct(payload)
      }

      setLoading(false)
      router.push('/dashboard/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar producto')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!productId) return

    const confirmed = window.confirm('¿Seguro que quieres eliminar este producto?')
    if (!confirmed) return

    setError('')
    setDeleting(true)

    try {
      await deleteProduct(productId)
      setDeleting(false)
      router.push('/dashboard/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar producto')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[720px]">
      {error && (
        <div className="p-3 bg-red-100 text-red-600 rounded-lg mb-4">{error}</div>
      )}

      <div>
        <label className="block mb-1.5 text-sm font-medium">Nombre *</label>
        <input name="name" value={form.name} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm mb-3" />
      </div>

      <div>
        <label className="block mb-1.5 text-sm font-medium">Precio *</label>
        <input name="price" value={form.price} onChange={handleChange} type="number" min="0" step="0.01" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      </div>

      <div>
        <label className="block mb-1.5 text-sm font-medium">Stock</label>
        <input name="stock" value={form.stock} onChange={handleChange} type="number" min="0" step="1" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      </div>

      <div>
        <ImageUpload
          value={form.image}
          onChange={(url) => setForm((p) => ({ ...p, image: url }))}
          folder="products"
          label="Imagen del producto"
        />
      </div>

      <div>
        <label className="block mb-1.5 text-sm font-medium">Descripción</label>
        <textarea name="description" value={form.description} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 min-h-[100px]" />
      </div>

      <div className="mt-3 flex gap-3">
        <Button type="submit" disabled={loading}>{loading ? (mode === 'edit' ? 'Guardando...' : 'Creando...') : (mode === 'edit' ? 'Guardar cambios' : 'Crear producto')}</Button>
        {mode === 'edit' && productId ? (
          <Button type="button" variant="danger" disabled={deleting} onClick={handleDelete}>
            {deleting ? 'Eliminando...' : 'Eliminar producto'}
          </Button>
        ) : null}
      </div>
    </form>
  )
}
