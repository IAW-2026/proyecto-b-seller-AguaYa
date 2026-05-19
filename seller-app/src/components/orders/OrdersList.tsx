/**
 * OrdersList.tsx — Listado de órdenes del vendedor con tabs.
 *
 * Es un server component que obtiene órdenes cacheadas y las pasa
 * a OrdersTabs para la interacción con tabs.
 */

import { auth } from '@clerk/nextjs/server'
import { getVendorByUserId, getVendorOrders as getCachedVendorOrders } from '@/lib/queries'
import OrdersTabs from '@/components/orders/OrdersTabs'
import { Package } from 'lucide-react'
import type { Order, OrderItem } from '@prisma/client'

type OrderWithItems = Order & {
  items: (OrderItem & {
    product: any
  })[]
}

export default async function OrdersList() {
  const { userId } = await auth()
  if (!userId) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        <p className="font-semibold">Error: No autenticado</p>
      </div>
    )
  }

  const vendor = await getVendorByUserId(userId)
  if (!vendor) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        <p className="font-semibold">Error: No autenticado</p>
      </div>
    )
  }

  let orders: OrderWithItems[] = []
  let error: string | null = null

  try {
    const result = await getCachedVendorOrders(vendor.id)
    orders = result as OrderWithItems[]
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error al cargar órdenes'
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        <p className="font-semibold">Error: {error}</p>
      </div>
    )
  }

  const paidOrders = orders.filter((o) => o.status === 'PAID')
  const readyOrders = orders.filter((o) => o.status === 'READY')

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
        <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <p className="text-lg">No hay órdenes aún</p>
        <p className="text-sm">Las órdenes que recibas aparecerán aquí</p>
      </div>
    )
  }

  return <OrdersTabs paidOrders={paidOrders} readyOrders={readyOrders} />
}
