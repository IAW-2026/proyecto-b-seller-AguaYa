'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, deleteProduct, updateProduct } from '@/app/actions/product'
import Button from './ui/Button'
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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, marginBottom: 12,
  }

  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
      {error && <div style={{ padding: 12, backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      <div>
        <label style={labelStyle}>Nombre *</label>
        <input name="name" value={form.name} onChange={handleChange} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Precio *</label>
        <input name="price" value={form.price} onChange={handleChange} style={inputStyle} type="number" />
      </div>

      <div>
        <label style={labelStyle}>Stock</label>
        <input name="stock" value={form.stock} onChange={handleChange} style={inputStyle} type="number" />
      </div>

      <div>
        <label style={labelStyle}>Imagen (URL)</label>
        <input name="image" value={form.image} onChange={handleChange} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Descripción</label>
        <textarea name="description" value={form.description} onChange={handleChange} style={{ ...inputStyle, minHeight: 100 }} />
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
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
