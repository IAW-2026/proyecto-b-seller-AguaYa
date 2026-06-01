'use client'

import { useState } from 'react'
import type { Vendor, Product, Order, Review, Paginated } from '@/lib/types'
import OverviewTab from './OverviewTab'
import ProductsTab from './ProductsTab'
import OrdersTab from './OrdersTab'

export type { Vendor, Product, Order, Review, Paginated, OrderItem } from '@/lib/types'

export default function VendorDetailTabs({
  vendor,
  products,
  paidOrders,
  readyOrders,
  reviews,
  promedio,
  totalReviews,
}: {
  vendor: Vendor
  products: Paginated<Product>
  paidOrders: Paginated<Order>
  readyOrders: Paginated<Order>
  reviews: Review[]
  promedio: number
  totalReviews: number
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview')

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">{vendor.name}</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{vendor.clerkName}</p>

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

      {activeTab === 'overview' && <OverviewTab vendor={vendor} reviews={reviews} promedio={promedio} totalReviews={totalReviews} />}
      {activeTab === 'products' && <ProductsTab vendorId={vendor.id} products={products} />}
      {activeTab === 'orders' && <OrdersTab paidOrders={paidOrders} readyOrders={readyOrders} />}
    </div>
  )
}
