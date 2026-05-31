'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { updateOrderStatusAsAdmin } from '@/app/actions/admin-vendor'
import ProductFormDialog from '@/components/products/ProductFormDialog'
import AdminVendorEditDialog from '@/components/admin/AdminVendorEditDialog'
import ToggleVendorButton from '@/components/vendors/ToggleVendorButton'
import Pagination from '@/components/Pagination'
import { Package, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react'

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
  isActive: boolean
}

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  image: string | null
  isActive: boolean
}

type OrderItem = {
  productName: string
  productPrice: number
  quantity: number
}

type Order = {
  id: string
  externalId: string
  status: string
  total: number
  address: string | null
  createdAt: string
  buyerId: string
  items: OrderItem[]
}

type Review = {
  orderId: string
  buyerName: string
  rating: number
  description?: string
  createdAt: string
  products: string[]
}

type Paginated<T> = {
  items: T[]
  page: number
  pageCount: number
}

export default function VendorDetailTabs({
  vendor,
  products,
  productsPage,
  productsPageCount,
  productsTotal,
  paidOrders,
  paidPage,
  paidPageCount,
  paidTotal,
  readyOrders,
  readyPage,
  readyPageCount,
  readyTotal,
  paidOrders,
  readyOrders,
  reviews,
}: {
  vendor: Vendor
  products: Paginated<Product>
  paidOrders: Paginated<Order>
  readyOrders: Paginated<Order>
  reviews: Review[]
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview')

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">{vendor.name}</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{vendor.clerkName}</p>
      <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">{vendor.name}</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{vendor.clerkName}</p>

      <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'overview'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'products'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Productos
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'orders'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Pedidos
        </button>
      </div>

      {activeTab === 'overview' && <OverviewTab vendor={vendor} reviews={reviews} />}
      {activeTab === 'products' && <ProductsTab vendorId={vendor.id} products={products} />}
      {activeTab === 'orders' && <OrdersTab paidOrders={paidOrders} readyOrders={readyOrders} />}
    </div>
  )
}

function OverviewTab({ vendor, reviews }: { vendor: Vendor; reviews: Review[] }) {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())

  const toggleReview = (orderId: string) => {
    setExpandedReviews((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Información del vendedor</h3>
          <div className="flex items-center gap-2">
            <ToggleVendorButton vendorId={vendor.id} isActive={vendor.isActive} vendorName={vendor.name} role="admin" />
            <AdminVendorEditDialog vendor={vendor} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Nombre</span>
            <p className="font-medium text-slate-900 dark:text-white">{vendor.name}</p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Dirección</span>
            <p className="font-medium text-slate-900 dark:text-white">{vendor.address}</p>
          </div>
          {vendor.description && (
            <div className="col-span-2">
              <span className="text-slate-500 dark:text-slate-400">Descripción</span>
              <p className="font-medium text-slate-900 dark:text-white">{vendor.description}</p>
            </div>
          )}
          {vendor.cuil && (
            <div>
              <span className="text-slate-500 dark:text-slate-400">CUIL</span>
              <p className="font-medium text-slate-900 dark:text-white">{vendor.cuil}</p>
            </div>
          )}
          {vendor.cuit && (
            <div>
              <span className="text-slate-500 dark:text-slate-400">CUIT</span>
              <p className="font-medium text-slate-900 dark:text-white">{vendor.cuit}</p>
            </div>
          )}
          <div>
            <span className="text-slate-500 dark:text-slate-400">Reputación</span>
            <p className="font-medium text-slate-900 dark:text-white">{vendor.reputation} / 5</p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Estado</span>
            <p className="font-medium text-slate-900 dark:text-white">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                vendor.isActive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${vendor.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {vendor.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Reseñas ({reviews.length})
        </h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No hay reseñas todavía.</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">No hay reseñas todavía.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => {
              const isExpanded = expandedReviews.has(review.orderId)
              return (
                <div key={review.orderId} className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/50">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-white">{review.buyerName}</span>
                    <span className="text-sm text-slate-400 dark:text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mb-1 text-sm text-amber-500">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                  {review.description && (
                    <>
                      <p className={`text-sm text-slate-600 dark:text-slate-300 ${!isExpanded && review.description.length > 100 ? 'line-clamp-2' : ''}`}>
                        {review.description}
                      </p>
                      {review.description.length > 100 && (
                        <button
                          onClick={() => toggleReview(review.orderId)}
                          className="mt-1 flex items-center gap-1 text-xs text-sky-600 hover:text-sky-500 dark:text-sky-400"
                        >
                          {isExpanded ? (
                            <>Ver menos <ChevronUp className="h-3 w-3" /></>
                          ) : (
                            <>Ver más <ChevronDown className="h-3 w-3" /></>
                          )}
                        </button>
                      )}
                    </>
                  )}
                  {review.products.length > 0 && (
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Productos: {review.products.join(', ')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductsTab({ vendorId, products }: { vendorId: string; products: Paginated<Product> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('product_page', String(page))
    return `${pathname}?${params.toString()}`
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Productos ({products.items.length})
        </h3>
      </div>

      {products.items.length === 0 ? (
        <div className="p-12 text-center text-slate-400 dark:text-slate-500">
          <Package className="mx-auto mb-4 h-10 w-10" />
          <p>No hay productos.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {products.items.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{product.name}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">${product.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{product.stock}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ProductFormDialog
                        mode="edit"
                        productId={product.id}
                        initialData={{
                          name: product.name,
                          description: product.description || undefined,
                          price: product.price,
                          stock: product.stock,
                          image: product.image || undefined,
                        }}
                        vendorId={vendorId}
                      >
                        <button className="rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-sky-50 dark:border-sky-700 dark:text-sky-400 dark:hover:bg-sky-900/20">
                          Editar
                        </button>
                      </ProductFormDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {products.pageCount > 1 && (
        <div className="mt-4">
          <Pagination
            page={products.page}
            pageCount={products.pageCount}
            onPageChange={(p) => router.push(buildPageUrl(p))}
          />
        </div>
      )}
    </div>
  )
}

function OrdersTab({
  paidOrders,
  readyOrders,
}: {
  paidOrders: Paginated<Order>
  readyOrders: Paginated<Order>
}) {
  const [activeSubTab, setActiveSubTab] = useState<'paid' | 'ready'>('paid')

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        <button
          onClick={() => setActiveSubTab('paid')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            activeSubTab === 'paid'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Para confirmar
        </button>
        <button
          onClick={() => setActiveSubTab('ready')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            activeSubTab === 'ready'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Listas para entregar
        </button>
      </div>

      {activeSubTab === 'paid' ? (
        <OrderList orders={paidOrders} status="PAID" />
      ) : (
        <OrderList orders={readyOrders} status="READY" />
      )}
    </div>
  )
}

function OrderList({ orders, status }: { orders: Paginated<Order>; status: string }) {
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const paramKey = status === 'PAID' ? 'paid_page' : 'ready_page'

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(paramKey, String(page))
    return `${pathname}?${params.toString()}`
  }

  const handleConfirm = async (orderId: string) => {
    setUpdating(orderId)
    await updateOrderStatusAsAdmin(orderId, 'READY')
    setUpdating(null)
    router.refresh()
  }

  if (orders.items.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 dark:text-slate-500">
        <ShoppingBag className="mx-auto mb-4 h-10 w-10" />
        <p>{status === 'PAID' ? 'No hay órdenes pendientes.' : 'No hay órdenes listas.'}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-3">
        {orders.items.map((order) => (
          <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900 dark:text-white">#{order.externalId}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString('es-ES', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                order.status === 'PAID'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
              }`}>
                {order.status}
              </span>
            </div>
            <div className="mb-2 flex flex-wrap gap-x-1 text-xs text-slate-600 dark:text-slate-300">
              {order.items.map((item, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-slate-300 dark:text-slate-600">|</span>}
                  <span>{item.productName} x{item.quantity} — ${(item.productPrice * item.quantity).toFixed(2)}</span>
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Total: ${order.total.toFixed(2)}</span>
              {status === 'PAID' && (
                <button
                  onClick={() => handleConfirm(order.id)}
                  disabled={updating === order.id}
                  className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
                >
                  {updating === order.id ? '...' : 'Marcar lista'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {orders.pageCount > 1 && (
        <div className="mt-4">
          <Pagination
            page={orders.page}
            pageCount={orders.pageCount}
            onPageChange={(p) => router.push(buildPageUrl(p))}
          />
        </div>
      )}
    </div>
  )
}
