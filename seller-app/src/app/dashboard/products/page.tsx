import React from 'react'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export default async function ProductsPage() {
  const { userId } = await auth()
  if (!userId) return null

  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    include: { products: { orderBy: { createdAt: 'desc' } } },
  })

  if (!vendor) {
    return (
      <div>
        <h1>Products</h1>
        <p>No existe un vendedor asociado a esta cuenta. Registra tu negocio primero.</p>
        <Link href="/setup-vendor">Registrar negocio</Link>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Products</h1>
        <Link href="/dashboard/products/new">+ Nuevo producto</Link>
      </div>

      {vendor.products.length === 0 ? (
        <p>No tienes productos aún.</p>
      ) : (
        <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
          {vendor.products.map((p) => (
            <li key={p.id} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{p.name}</strong>
                  <div>Precio: ${p.price}</div>
                  <div>Stock: {p.stock}</div>
                </div>
                <div>
                  <Link href={`/dashboard/products/${p.id}`}>Editar</Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
