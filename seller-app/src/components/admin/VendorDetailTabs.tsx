'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProductAsAdmin, updateOrderStatusAsAdmin } from '@/app/actions/admin-vendor'

type Vendor = {
  id: string
  name: string
  description: string | null
  address: string
  image: string | null
  cuil: string | null
  cuit: string | null
  reputation: number
  clerkName: string
  clerkEmail: string
}

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  image: string | null
}

type Order = {
  id: string
  externalId: string
  status: string
  total: number
  address: string | null
  createdAt: string
  buyerId: string
  items: {
    productName: string
    productPrice: number
    quantity: number
  }[]
}

type Review = {
  orderId: string
  buyerName: string
  rating: number
  description?: string
  createdAt: string
  products: string[]
}

export default function VendorDetailTabs({
  vendor,
  products,
  orders,
  reviews,
}: {
  vendor: Vendor
  products: Product[]
  orders: Order[]
  reviews: Review[]
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview')
  const router = useRouter()

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">{vendor.name}</h1>
      <p className="mb-6 text-sm text-slate-500">{vendor.clerkName} ({vendor.clerkEmail})</p>

      <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'products' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Orders
        </button>
      </div>

      {activeTab === 'overview' && <OverviewTab vendor={vendor} reviews={reviews} />}
      {activeTab === 'products' && (
        <ProductsTab vendorId={vendor.id} products={products} router={router} />
      )}
      {activeTab === 'orders' && <OrdersTab orders={orders} />}
    </div>
  )
}

function OverviewTab({ vendor, reviews }: { vendor: Vendor; reviews: Review[] }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Información del vendedor</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Nombre</span>
            <p className="font-medium text-slate-900">{vendor.name}</p>
          </div>
          <div>
            <span className="text-slate-500">Dirección</span>
            <p className="font-medium text-slate-900">{vendor.address}</p>
          </div>
          {vendor.description && (
            <div className="col-span-2">
              <span className="text-slate-500">Descripción</span>
              <p className="font-medium text-slate-900">{vendor.description}</p>
            </div>
          )}
          {vendor.cuil && (
            <div>
              <span className="text-slate-500">CUIL</span>
              <p className="font-medium text-slate-900">{vendor.cuil}</p>
            </div>
          )}
          {vendor.cuit && (
            <div>
              <span className="text-slate-500">CUIT</span>
              <p className="font-medium text-slate-900">{vendor.cuit}</p>
            </div>
          )}
          <div>
            <span className="text-slate-500">Reputación</span>
            <p className="font-medium text-slate-900">{vendor.reputation} / 5</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Reseñas</h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500">No hay reseñas todavía.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.orderId} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium text-slate-900">{review.buyerName}</span>
                  <span className="text-sm text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mb-1 text-sm text-amber-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                {review.description && <p className="text-sm text-slate-600">{review.description}</p>}
                {review.products.length > 0 && (
                  <p className="mt-1 text-xs text-slate-400">Productos: {review.products.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductsTab({
  vendorId,
  products,
  router,
}: {
  vendorId: string
  products: Product[]
  router: ReturnType<typeof useRouter>
}) {
  const handleDelete = async (productId: string) => {
    if (!window.confirm('¿Eliminar este producto?')) return
    await deleteProductAsAdmin(vendorId, productId)
    router.refresh()
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Productos ({products.length})</h3>
        <a
          href={`/dashboard/products/new`}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Nuevo producto
        </a>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-slate-500">No hay productos.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{product.name}</td>
                  <td className="px-4 py-3 text-slate-700">${product.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-700">{product.stock}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function OrdersTab({ orders }: { orders: Order[] }) {
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()

  const handleConfirm = async (orderId: string) => {
    setUpdating(orderId)
    await updateOrderStatusAsAdmin(orderId, 'READY')
    setUpdating(null)
    router.refresh()
  }

  const paidOrders = orders.filter((o) => o.status === 'PAID')
  const readyOrders = orders.filter((o) => o.status === 'READY')

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Para confirmar ({paidOrders.length})
        </h3>
        {paidOrders.length === 0 ? (
          <p className="text-sm text-slate-500">No hay órdenes pendientes.</p>
        ) : (
          <div className="space-y-4">
            {paidOrders.map((order) => (
              <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-900">#{order.externalId}</span>
                    <span className="ml-2 text-sm text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                    {order.status}
                  </span>
                </div>
                <div className="mb-2 space-y-1 text-sm text-slate-600">
                  {order.items.map((item, i) => (
                    <p key={i}>
                      {item.productName} x{item.quantity} — ${(item.productPrice * item.quantity).toFixed(2)}
                    </p>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="font-semibold text-slate-900">Total: ${order.total.toFixed(2)}</span>
                  <button
                    onClick={() => handleConfirm(order.id)}
                    disabled={updating === order.id}
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
                  >
                    {updating === order.id ? '...' : 'Confirmar como lista'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Listas para entregar ({readyOrders.length})
        </h3>
        {readyOrders.length === 0 ? (
          <p className="text-sm text-slate-500">No hay órdenes listas.</p>
        ) : (
          <div className="space-y-4">
            {readyOrders.map((order) => (
              <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-900">#{order.externalId}</span>
                    <span className="ml-2 text-sm text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    {order.status}
                  </span>
                </div>
                <div className="mb-2 space-y-1 text-sm text-slate-600">
                  {order.items.map((item, i) => (
                    <p key={i}>
                      {item.productName} x{item.quantity} — ${(item.productPrice * item.quantity).toFixed(2)}
                    </p>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="font-semibold text-slate-900">Total: ${order.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
