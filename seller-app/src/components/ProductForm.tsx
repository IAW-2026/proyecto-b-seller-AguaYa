'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, updateProduct } from '@/app/actions/product'
import Button from './ui/Button'
import ImageUpload from './ui/ImageUpload'
import DeleteProductDialog from './products/DeleteProductDialog'
import { validateProductInput } from '../lib/validation'

interface ProductFormProps {
  mode?: 'create' | 'edit'
  productId?: string
  vendorId?: string
  initialData?: {
    name: string
    description?: string
    price?: number
    stock?: number
    image?: string
  }
  onSuccess?: () => void
}

export default function ProductForm({ mode = 'create', productId, vendorId, initialData, onSuccess }: ProductFormProps) {
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

        await updateProduct({ id: productId, ...payload, vendorId })
      } else {
        await createProduct(payload)
      }

      setLoading(false)
      onSuccess?.()
      router.push('/dashboard/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar producto')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[720px]">
      {error && (
        <div className="p-3 bg-red-100 text-red-600 rounded-lg mb-4 dark:bg-red-900/50 dark:text-red-400">{error}</div>
      )}

      <div>
        <label className="block mb-1.5 text-sm font-medium dark:text-slate-300">Nombre *</label>
        <input name="name" value={form.name} onChange={handleChange} maxLength={20} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-500" />
      </div>

      <div>
        <label className="block mb-1.5 text-sm font-medium dark:text-slate-300">Precio *</label>
        <input name="price" value={form.price} onChange={handleChange} type="number" min="0" step="0.01" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      </div>

      <div>
        <label className="block mb-1.5 text-sm font-medium dark:text-slate-300">Stock</label>
        <input name="stock" value={form.stock} onChange={handleChange} type="number" min="0" step="1" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
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
        <label className="block mb-1.5 text-sm font-medium dark:text-slate-300">Descripción</label>
        <textarea name="description" value={form.description} onChange={handleChange} maxLength={150} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-500 min-h-[100px]" />
      </div>

      <div className="mt-3 flex gap-3">
        <Button type="submit" disabled={loading}>{loading ? (mode === 'edit' ? 'Guardando...' : 'Creando...') : (mode === 'edit' ? 'Guardar cambios' : 'Crear producto')}</Button>
        {mode === 'edit' && productId ? (
          <DeleteProductDialog productId={productId} productName={form.name || 'este producto'} vendorId={vendorId} />
        ) : null}
      </div>
    </form>
  )
}
