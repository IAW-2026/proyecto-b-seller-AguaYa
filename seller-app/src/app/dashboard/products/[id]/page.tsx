import React from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProductForm from '@/components/ProductForm'

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const vendor = await prisma.vendor.findUnique({ where: { userId } })

  if (!vendor) {
    redirect('/dashboard/setup-vendor')
  }

  const { id } = await params // Await params como se requiere en Next.js 15+

  const product = await prisma.product.findFirst({
    where: {
      id,
      vendorId: vendor.id,
      deletedAt: null, // Solo permitir editar productos no eliminados
    },
  })

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
