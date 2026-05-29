'use client'

import { useRouter } from 'next/navigation'
import { updateOrderStatusAsAdmin, deleteOrderAsAdmin } from '@/app/actions/admin-vendor'
import Pagination from '@/components/Pagination'

interface OrderItem {
  id: string
  productName: string
  quantity: number
  productPrice: number
}

interface Order {
  id: string
  externalId: string
  buyerId: string
  status: 'PAID' | 'READY'
  total: number
  address: string | null
  createdAt: Date
  vendor: { id: string; name: string }
  items: OrderItem[]
}

export default function AdminOrdersTable({
  orders,
  page,
  pageCount,
}: {
  orders: Order[]
  page: number
  pageCount: number
}) {
  const router = useRouter()

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Orden</th>
              <th className="px-4 py-3 font-medium">Vendedor</th>
              <th className="px-4 py-3 font-medium">Comprador</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                  No hay órdenes registradas.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {o.externalId || o.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{o.vendor.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">{o.buyerId.slice(0, 12)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">${o.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      o.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                    }`}>
                      {o.status === 'PAID' ? 'Pagada' : 'Lista'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const newStatus = o.status === 'PAID' ? 'READY' : 'PAID'
                          await updateOrderStatusAsAdmin(o.id, newStatus)
                          router.refresh()
                        }}
                        className="rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700"
                      >
                        {o.status === 'PAID' ? 'Marcar Lista' : 'Volver a Pagada'}
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`¿Eliminar orden ${o.externalId || o.id.slice(0, 8)}?`)) {
                            await deleteOrderAsAdmin(o.id)
                            router.refresh()
                          }
                        }}
                        className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} onPageChange={(p) => router.push(`/dashboard/admin/orders?page=${p}`)} />
    </div>
  )
}
