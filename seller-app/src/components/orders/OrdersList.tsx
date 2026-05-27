import { auth } from '@clerk/nextjs/server'
import { getVendorByUserId, getVendorOrdersByStatus } from '@/lib/queries'
import OrdersTabs from '@/components/orders/OrdersTabs'
import { Package } from 'lucide-react'

export default async function OrdersList({
  paidPage = 1,
  readyPage = 1,
}: {
  paidPage?: number
  readyPage?: number
}) {
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

  let paidResult: Awaited<ReturnType<typeof getVendorOrdersByStatus>> | null = null
  let readyResult: Awaited<ReturnType<typeof getVendorOrdersByStatus>> | null = null
  let error: string | null = null

  try {
    const [pr, rr] = await Promise.all([
      getVendorOrdersByStatus(vendor.id, 'PAID', paidPage),
      getVendorOrdersByStatus(vendor.id, 'READY', readyPage),
    ])
    paidResult = pr
    readyResult = rr
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

  if (!paidResult || !readyResult) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
        <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <p className="text-lg">No hay órdenes aún</p>
        <p className="text-sm">Las órdenes que recibas aparecerán aquí</p>
      </div>
    )
  }

  return (
    <OrdersTabs
      paidOrders={paidResult.items as any[]}
      paidPage={paidPage}
      paidPageCount={paidResult.pageCount}
      readyOrders={readyResult.items as any[]}
      readyPage={readyPage}
      readyPageCount={readyResult.pageCount}
    />
  )
}
