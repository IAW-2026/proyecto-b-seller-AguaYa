'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProductAsAdmin, updateOrderStatusAsAdmin } from '@/app/actions/admin-vendor'
import Pagination from '@/components/Pagination'

type Vendor = {
  id: string
  name: string
  description: string | null
  address: string
  image: string | null
  cuil: string | null
  cuit: string | null
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
  rating: number
  description?: string
  createdAt: string
  products: string[]
}

const PAGE_SIZE = 10

export default function VendorDetailTabs({
  vendor,
  products,
  orders,
  reviews,
  promedio,
  totalReviews,
}: {
  vendor: Vendor
  products: Product[]
  orders: Order[]
  reviews: Review[]
  promedio: number
  totalReviews: number
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview')

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
          Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Orders ({orders.length})
        </button>
      </div>

      {activeTab === 'overview' && <OverviewTab vendor={vendor} reviews={reviews} promedio={promedio} totalReviews={totalReviews} />}
      {activeTab === 'products' && <ProductsTab vendorId={vendor.id} products={products} />}
      {activeTab === 'orders' && <OrdersTab orders={orders} />}
    </div>
  )
}

function OverviewTab({ vendor, reviews, promedio, totalReviews }: { vendor: Vendor; reviews: Review[]; promedio: number; totalReviews: number }) {
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
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Reseñas</h3>
          {totalReviews > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-amber-500 text-base">{'★'.repeat(Math.round(promedio))}{'☆'.repeat(5 - Math.round(promedio))}</span>
              <span className="font-semibold text-slate-900">{promedio}</span>
              <span className="text-slate-400">({totalReviews} reseñas)</span>
            </div>
          )}
        </div>
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500">No hay reseñas todavía.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.orderId} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium text-slate-900">Orden {review.orderId.slice(0, 8)}</span>
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

function ProductsTab({ vendorId, products }: { vendorId: string; products: Product[] }) {
  const [page, setPage] = useState(1)
  const router = useRouter()
  const totalPages = Math.ceil(products.length / PAGE_SIZE)
  const visible = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleDelete = async (productId: string) => {
    if (!window.confirm('¿Eliminar este producto?')) return
    await deleteProductAsAdmin(vendorId, productId)
    router.refresh()
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Productos ({products.length})</h3>
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
              {visible.map((product) => (
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

      <Pagination page={page} pageCount={totalPages} onPageChange={setPage} />
    </div>
  )
}

function OrdersTab({ orders }: { orders: Order[] }) {
  const [page, setPage] = useState(1)
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()
  const totalPages = Math.ceil(orders.length / PAGE_SIZE)
  const visible = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleConfirm = async (orderId: string) => {
    setUpdating(orderId)
    await updateOrderStatusAsAdmin(orderId, 'READY')
    setUpdating(null)
    router.refresh()
  }

  const paidOrders = visible.filter((o) => o.status === 'PAID')
  const readyOrders = visible.filter((o) => o.status === 'READY')

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

      <Pagination page={page} pageCount={totalPages} onPageChange={setPage} />
    </div>
  )
}
