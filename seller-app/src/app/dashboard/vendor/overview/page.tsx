/**
 * Página de resumen del dashboard (`/dashboard/overview`). Muestra métricas, reseñas y órdenes recientes del vendedor.
 */
import React, { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { getVendorOverview } from '@/lib/queries/vendors'
import { getVendorReviewsWithStats } from '@/lib/queries/reviews'
import ToggleVendorButton from '@/components/vendors/ToggleVendorButton'
import AnimatedOrders from '@/components/orders/AnimatedOrders'
import OverviewLoading from '@/components/ui/loadings/OverviewLoading'

async function OverviewContent() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const [overview, reviewStats] = await Promise.all([
    getVendorOverview(userId),
    getVendorReviewsWithStats(userId),
  ])
  const reviews = reviewStats.reviews

  if (!overview) {
    return (
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-400">Overview</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">No existe un vendedor asociado a esta cuenta todavía.</h1>
        <p className="text-slate-600 dark:text-slate-400">Cuando registres el perfil del vendedor, acá vas a ver sus métricas, productos y órdenes.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 xl:gap-8 xl:h-full">
      {/* Vendor name + address */}
      <div className="rounded-[1.5rem] border border-white/30 bg-white/20 px-8 py-5 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-900/30">
        <h1 className="truncate text-fluid-2xl font-bold text-slate-950 dark:text-slate-100">{overview.name}</h1>
        <p className="mt-1 truncate text-fluid-sm text-slate-500 dark:text-slate-400">
          {overview.address}{overview.address && overview.description ? ' · ' : ''}{overview.description}
        </p>
      </div>

      {/* Vendor status card */}
      <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-white/30 bg-white/20 px-8 py-4 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-900/30">
        <span className="truncate text-fluid-sm font-semibold text-slate-700 dark:text-slate-300">Estado del vendedor</span>
        <div className="flex shrink-0 items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-fluid-xs font-medium ${
            overview.isActive
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
          }`}>
            <span className={`h-2 w-2 rounded-full ${overview.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {overview.isActive ? 'Activo' : 'Inactivo'}
          </span>
          <ToggleVendorButton vendorId={overview.id} isActive={overview.isActive} vendorName={overview.name} role="vendor" size="sm" />
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-5 xl:gap-6">
        <div className="rounded-xl border border-white/30 bg-white/20 px-6 py-5 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-900/30">
          <p className="text-fluid-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Productos</p>
          <p className="mt-2 text-fluid-2xl font-bold text-slate-950 dark:text-white">{overview._count.products}</p>
        </div>
        <div className="rounded-xl border border-white/30 bg-white/20 px-6 py-5 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-900/30">
          <p className="text-fluid-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Órdenes</p>
          <p className="mt-2 text-fluid-2xl font-bold text-slate-950 dark:text-white">{overview._count.orders}</p>
        </div>
        <div className="rounded-xl border border-white/30 bg-white/20 px-6 py-5 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-900/30">
          <p className="text-fluid-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Reseñas</p>
          <p className="mt-2 text-fluid-2xl font-bold text-slate-950 dark:text-white">
            {reviewStats.total > 0 ? (
              <span>{reviewStats.promedio.toFixed(1)}</span>
            ) : (
              '—'
            )}
          </p>
        </div>
      </div>

      {/* Bottom section: reviews + orders */}
      <div className="flex flex-1 flex-col gap-6 xl:flex-row xl:gap-6 xl:overflow-hidden">
        {/* Reviews */}
        <section className="flex flex-col rounded-[1.5rem] border border-white/30 bg-white/20 p-6 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-900/30 xl:flex-1 xl:overflow-hidden">
          <h2 className="mb-3 flex items-center gap-2 text-fluid-xl font-semibold text-slate-950 dark:text-white">
            Reseñas{' '}
            {reviewStats.total > 0 && (
              <span className="truncate text-fluid-sm font-normal text-slate-500 dark:text-slate-400">
                ({reviewStats.total}) {reviewStats.promedio.toFixed(1)}
              </span>
            )}
          </h2>
              <div className="flex-1 space-y-2">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.orderId} className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-md dark:border-slate-700/30 dark:bg-slate-800/20">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="truncate text-fluid-xs font-semibold text-slate-900 dark:text-slate-100">Orden {review.orderId.slice(0, 8)}</span>
                    <span className="shrink-0 text-fluid-xs text-amber-400">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  </div>
                  {review.products.length > 0 && (
                    <p className="mt-0.5 truncate text-fluid-xs text-slate-500 dark:text-slate-400">{review.products.join(', ')}</p>
                  )}
                  {review.description && (
                    <p className="mt-1 truncate text-fluid-xs italic text-slate-600 dark:text-slate-300">&ldquo;{review.description}&rdquo;</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-500">No hay reseñas todavía.</p>
            )}
          </div>
        </section>

        {/* Recent orders */}
        <section className="flex flex-col rounded-[1.5rem] border border-white/30 bg-white/20 p-6 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-900/30 xl:w-[480px] xl:shrink-0">
          <h2 className="mb-4 text-fluid-xl font-semibold text-slate-950 dark:text-white">Órdenes recientes</h2>
          <div className="flex min-h-0 flex-1 flex-col">
            <AnimatedOrders orders={overview.orders} />
          </div>
        </section>
      </div>
    </div>
  )
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<OverviewLoading />}>
      <OverviewContent />
    </Suspense>
  )
}
