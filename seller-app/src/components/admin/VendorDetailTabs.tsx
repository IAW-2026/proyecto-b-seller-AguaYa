'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { updateOrderStatusAsAdmin } from '@/app/actions/admin-vendor'
import Pagination from '@/components/Pagination'
import ProductFormDialog from '@/components/products/ProductFormDialog'
import AdminVendorEditDialog from '@/components/admin/AdminVendorEditDialog'

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
  reviews,
}: {
  vendor: Vendor
  products: Product[]
  productsPage: number
  productsPageCount: number
  productsTotal: number
  paidOrders: Order[]
  paidPage: number
  paidPageCount: number
  paidTotal: number
  readyOrders: Order[]
  readyPage: number
  readyPageCount: number
  readyTotal: number
  reviews: Review[]
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview')
  const router = useRouter()

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">{vendor.name}</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{vendor.clerkName}</p>

      <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'products' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Productos ({productsTotal})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Órdenes ({paidTotal + readyTotal})
        </button>
      </div>

      {activeTab === 'overview' && <OverviewTab vendor={vendor} reviews={reviews} />}
      {activeTab === 'products' && <ProductsTab
        vendorId={vendor.id}
        products={products}
        productsPage={productsPage}
        productsPageCount={productsPageCount}
        productsTotal={productsTotal}
      />}
      {activeTab === 'orders' && <OrdersTab
        paidOrders={paidOrders}
        paidPage={paidPage}
        paidPageCount={paidPageCount}
        paidTotal={paidTotal}
        readyOrders={readyOrders}
        readyPage={readyPage}
        readyPageCount={readyPageCount}
        readyTotal={readyTotal}
      />}
    </div>
  )
}

function OverviewTab({ vendor, reviews }: { vendor: Vendor; reviews: Review[] }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Información del vendedor</h3>
          <AdminVendorEditDialog vendor={vendor} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Nombre</span>
            <p className="font-medium text-slate-900 dark:text-slate-100">{vendor.name}</p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Dirección</span>
            <p className="font-medium text-slate-900 dark:text-slate-100">{vendor.address}</p>
          </div>
          {vendor.description && (
            <div className="col-span-2">
              <span className="text-slate-500 dark:text-slate-400">Descripción</span>
              <p className="font-medium text-slate-900 dark:text-slate-100">{vendor.description}</p>
            </div>
          )}
          {vendor.cuil && (
            <div>
              <span className="text-slate-500 dark:text-slate-400">CUIL</span>
              <p className="font-medium text-slate-900 dark:text-slate-100">{vendor.cuil}</p>
            </div>
          )}
          {vendor.cuit && (
            <div>
              <span className="text-slate-500 dark:text-slate-400">CUIT</span>
              <p className="font-medium text-slate-900 dark:text-slate-100">{vendor.cuit}</p>
            </div>
          )}
          <div>
            <span className="text-slate-500 dark:text-slate-400">Reputación</span>
            <p className="font-medium text-slate-900 dark:text-slate-100">{vendor.reputation} / 5</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Reseñas</h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No hay reseñas todavía.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.orderId} className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{review.buyerName}</span>
                  <span className="text-sm text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mb-1 text-sm text-amber-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                {review.description && <p className="text-sm text-slate-600 dark:text-slate-400">{review.description}</p>}
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

function ProductsTab({ vendorId, products, productsPage, productsPageCount, productsTotal }: {
  vendorId: string
  products: Product[]
  productsPage: number
  productsPageCount: number
  productsTotal: number
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  function buildPageUrl(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('product_page', String(page))
    return `${pathname}?${params.toString()}`
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Productos ({productsTotal})</h3>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No hay productos.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{product.name}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-400">${product.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-400">{product.stock}</td>
                  <td className="px-4 py-3">
                    <ProductFormDialog mode="edit" productId={product.id} vendorId={vendorId} initialData={{ name: product.name, description: product.description || undefined, price: product.price, stock: product.stock, image: product.image || undefined }}>
                      <span className="rounded-lg border border-sky-600 px-3 py-1 text-xs font-medium text-sky-600 transition hover:bg-sky-600 hover:text-white cursor-pointer dark:border-sky-400 dark:text-sky-400 dark:hover:bg-sky-500 dark:hover:text-white">Editar</span>
                    </ProductFormDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={productsPage} pageCount={productsPageCount} onPageChange={(p) => router.push(buildPageUrl(p))} />
    </div>
  )
}

function OrdersTab({
  paidOrders,
  paidPage,
  paidPageCount,
  paidTotal,
  readyOrders,
  readyPage,
  readyPageCount,
  readyTotal,
}: {
  paidOrders: Order[]
  paidPage: number
  paidPageCount: number
  paidTotal: number
  readyOrders: Order[]
  readyPage: number
  readyPageCount: number
  readyTotal: number
}) {
  const [activeTab, setActiveTab] = useState<'paid' | 'ready'>('paid')
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()

  const pathname = usePathname()
  const currentOrders = activeTab === 'paid' ? paidOrders : readyOrders
  const currentPage = activeTab === 'paid' ? paidPage : readyPage
  const currentPageCount = activeTab === 'paid' ? paidPageCount : readyPageCount

  const handleConfirm = async (orderId: string) => {
    setUpdating(orderId)
    await updateOrderStatusAsAdmin(orderId, 'READY')
    setUpdating(null)
    router.refresh()
  }

  const ordersSearchParams = useSearchParams()

  function handlePageChange(page: number) {
    const param = activeTab === 'paid' ? 'paid_page' : 'ready_page'
    const params = new URLSearchParams(ordersSearchParams.toString())
    params.set(param, String(page))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('paid')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'paid'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Para confirmar ({paidTotal})
        </button>
        <button
          onClick={() => setActiveTab('ready')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'ready'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Listas para entregar ({readyTotal})
        </button>
      </div>

      {currentOrders.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {activeTab === 'paid' ? 'No hay órdenes pendientes.' : 'No hay órdenes listas.'}
        </p>
      ) : (
        <div className="space-y-3">
          {currentOrders.map((order) => (
            <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">#{order.externalId}</span>
                  <span className="ml-2 text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  order.status === 'PAID'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="mb-1.5 flex flex-wrap gap-x-1 text-xs text-slate-600 dark:text-slate-400">
                {order.items.map((item, i) => (
                  <span key={i}>
                    {i > 0 && <span className="mr-1 text-slate-300 dark:text-slate-600">|</span>}
                    {item.productName} x{item.quantity} — ${(item.productPrice * item.quantity).toFixed(2)}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-700">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Total: ${order.total.toFixed(2)}</span>
                {order.status === 'PAID' && (
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
      )}

      <Pagination page={currentPage} pageCount={currentPageCount} onPageChange={handlePageChange} />
    </div>
  )
}
