import React from 'react'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export default async function OverviewPage() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    include: {
      _count: {
        select: {
          products: true,
          orders: true,
        },
      },
      products: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!vendor) {
    return (
      <div>
        <h1>Overview</h1>
        <p>No existe un vendedor asociado a esta cuenta todavía.</p>
        <p>Cuando registres el perfil del vendedor, acá vas a ver sus métricas, productos y órdenes.</p>
      </div>
    )
  }

  return (
    <div>
      <h1>Overview</h1>
      <p>Panel del vendedor: métricas y actividad asociadas a tu cuenta.</p>

      <div style={{ marginTop: 16, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <strong>{vendor.name}</strong>
        <div style={{ marginTop: 8 }}>{vendor.address}</div>
        {vendor.description ? <div style={{ marginTop: 4 }}>{vendor.description}</div> : null}
        <div style={{ marginTop: 4 }}>Reputación: {vendor.reputation}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 24 }}>
        <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <strong>Productos</strong>
          <div style={{ fontSize: 28, marginTop: 8 }}>{vendor._count.products}</div>
        </div>
        <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <strong>Órdenes</strong>
          <div style={{ fontSize: 28, marginTop: 8 }}>{vendor._count.orders}</div>
        </div>
        <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <strong>Estado</strong>
          <div style={{ fontSize: 20, marginTop: 8 }}>Activo</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginTop: 24 }}>
        <section style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <h2 style={{ marginTop: 0 }}>Productos recientes</h2>
          {vendor.products.length > 0 ? (
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              {vendor.products.map((product) => (
                <li key={product.id} style={{ marginBottom: 12 }}>
                  <strong>{product.name}</strong>
                  <div>Precio: ${product.price}</div>
                  <div>Stock: {product.stock}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay productos cargados.</p>
          )}
        </section>

        <section style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <h2 style={{ marginTop: 0 }}>Órdenes recientes</h2>
          {vendor.orders.length > 0 ? (
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              {vendor.orders.map((order) => (
                <li key={order.id} style={{ marginBottom: 12 }}>
                  <strong>Orden {order.id.slice(0, 8)}</strong>
                  <div>Estado: {order.status}</div>
                  <div>Total: ${order.total}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay órdenes cargadas.</p>
          )}
        </section>
      </div>
    </div>
  )
}
