import React from 'react'
import { redirect, notFound } from 'next/navigation'
import ProductForm from '@/components/ProductForm'
import { getVendorContext } from '@/lib/vendor-context'
import { getCachedProductById } from '@/lib/cache'

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { vendor } = await getVendorContext()

  if (!vendor) {
    redirect('/setup-vendor')
  }

  const { id } = await params

  const product = await getCachedProductById(id, vendor.id)

  if (!product) {
    notFound()
  }

  return (
    <div>
      <h1>Editar producto</h1>
      <p>Actualiza o elimina este producto desde aquí.</p>

      <div style={{ marginTop: 16 }}>
        <ProductForm
          mode="edit"
          productId={product.id}
          initialData={{
            name: product.name,
            description: product.description || '',
            price: product.price,
            stock: product.stock,
            image: product.image || '',
          }}
        />
      </div>
    </div>
  )
}
