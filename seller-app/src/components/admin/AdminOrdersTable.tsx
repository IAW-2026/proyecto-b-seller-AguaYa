'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { updateOrderStatusAsAdmin } from '@/app/actions/admin-vendor'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/ui/SearchBar'

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
  buyerName: string
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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const status = searchParams.get('status') || ''

  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v)
        else params.delete(k)
      }
      params.delete('page')
      const str = params.toString()
      router.push(str ? `${pathname}?${str}` : pathname)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="space-y-4">
      <SearchBar placeholder="Buscar por orden, comprador o dirección..." showDateFilter />

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit dark:bg-slate-800">
        {[
          { key: '', label: 'Todas' },
          { key: 'PAID', label: 'Pagadas' },
          { key: 'READY', label: 'Listas' },
        ].map((opt) => {
          const active = status === opt.key
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => pushParams({ status: opt.key })}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

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
              <th className="px-4 py-3 font-medium">Acción</th>
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
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{o.buyerName || o.buyerId.slice(0, 12)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">${o.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      o.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                    }`}>
                      {o.status === 'PAID' ? 'Pagada' : 'Lista'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                    {new Date(o.createdAt).toLocaleString('es-ES', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={async () => {
                        const newStatus = o.status === 'PAID' ? 'READY' : 'PAID'
                        await updateOrderStatusAsAdmin(o.id, newStatus)
                        router.refresh()
                      }}
                      className={`rounded px-3 py-1 text-xs font-medium text-white ${
                        o.status === 'PAID'
                          ? 'bg-sky-600 hover:bg-sky-700'
                          : 'bg-amber-500 hover:bg-amber-600'
                      }`}
                    >
                      {o.status === 'PAID' ? 'Marcar Lista' : 'Volver a Pagada'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageCount={pageCount}
        onPageChange={(p) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set('page', String(p))
          router.push(`${pathname}?${params.toString()}`)
        }}
      />
    </div>
  )
}
