/**
 * Panel de vista general del vendedor para administradores.
 * Muestra información del vendedor y la lista de reseñas con opción de expandir/colapsar.
 */
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Vendor, Review } from '@/lib/types'
import ToggleVendorButton from '@/components/vendors/ToggleVendorButton'
import AdminVendorEditDialog from '@/components/admin/AdminVendorEditDialog'

const star = (filled: boolean, i: number) => <span key={i}>{filled ? '★' : '☆'}</span>

/** Vista general del vendedor con información y reseñas. */
export default function OverviewTab({
  vendor,
  reviews,
  promedio,
  totalReviews,
}: {
  vendor: Vendor
  reviews: Review[]
  promedio: number
  totalReviews: number
}) {
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
      <div className="rounded-xl border border-white/30 bg-gradient-to-br from-white/30 to-slate-100/30 p-6 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/40 dark:from-slate-900/40 dark:to-slate-800/40">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Información del vendedor</h3>
          <div className="flex items-center gap-2">
            <ToggleVendorButton vendorId={vendor.id} isActive={vendor.isActive} vendorName={vendor.name} role="admin" />
            <AdminVendorEditDialog vendor={vendor} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-fluid-sm">
          <div className="min-w-0">
            <span className="text-slate-500 dark:text-slate-400">Nombre</span>
            <p className="truncate font-medium text-slate-900 dark:text-white">{vendor.name}</p>
          </div>
          <div className="min-w-0">
            <span className="text-slate-500 dark:text-slate-400">Dirección</span>
            <p className="truncate font-medium text-slate-900 dark:text-white">{vendor.address}</p>
          </div>
          {vendor.description && (
            <div className="col-span-2">
              <span className="text-slate-500 dark:text-slate-400">Descripción</span>
              <p className="truncate font-medium text-slate-900 dark:text-white">{vendor.description}</p>
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

      <div className="rounded-xl border border-white/30 bg-gradient-to-br from-white/30 to-slate-100/30 p-6 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/40 dark:from-slate-900/40 dark:to-slate-800/40">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Reseñas</h3>
          {totalReviews > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-amber-500 text-base">{'★'.repeat(Math.round(promedio))}{'☆'.repeat(5 - Math.round(promedio))}</span>
              <span className="font-semibold text-slate-900 dark:text-white">{promedio}</span>
              <span className="text-slate-400 dark:text-slate-500">({totalReviews} reseñas)</span>
            </div>
          )}
        </div>
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No hay reseñas todavía.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => {
              const isExpanded = expandedReviews.has(review.orderId)
              return (
                <div key={review.orderId} className="rounded-xl border border-white/20 bg-gradient-to-br from-white/20 to-slate-100/20 p-4 backdrop-blur-md dark:border-slate-700/30 dark:from-slate-800/30 dark:to-slate-800/20">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-white">Orden {review.orderId.slice(0, 8)}</span>
                    <span className="text-sm text-slate-400 dark:text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mb-1 text-sm text-amber-500">
                    {Array.from({ length: 5 }, (_, i) => star(i < review.rating, i))}
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
                    <p className="mt-1 truncate text-fluid-xs text-slate-400 dark:text-slate-500">
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
