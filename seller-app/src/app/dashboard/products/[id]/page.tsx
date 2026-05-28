import React, { Suspense } from 'react'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getVendorByUserId } from '@/lib/queries/vendors'
import { getProductById } from '@/lib/queries/products'
import ProductForm from '@/components/ProductForm'

async function ProductDetailContent({ id }: { id: string }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const vendor = await getVendorByUserId(userId)
  if (!vendor) redirect('/setup-vendor')

  const product = await getProductById(id, vendor.id)

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

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <Suspense fallback={<div className="text-center py-8 text-slate-500">Cargando producto...</div>}>
      <ProductDetailContent id={id} />
    </Suspense>
  )
}
