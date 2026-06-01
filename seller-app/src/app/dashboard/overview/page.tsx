import React, { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { getVendorOverview } from '@/lib/queries/vendors'
import { getVendorReviewsWithStats } from '@/lib/queries/reviews'
import ToggleVendorButton from '@/components/vendors/ToggleVendorButton'

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400" aria-label={`${rating} de 5 estrellas`}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

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
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/80">
        <strong className="text-lg text-slate-950 dark:text-slate-100">{overview.name}</strong>
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">{overview.address}</div>
        {overview.description ? <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">{overview.description}</div> : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
          <strong className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Productos</strong>
          <div className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{overview._count.products}</div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
          <strong className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Órdenes</strong>
          <div className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{overview._count.orders}</div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
          <strong className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado</strong>
          <div className="mt-3 flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${
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
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/80">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
            Reseñas {reviewStats.total > 0 && (
              <span className="text-lg text-slate-500 dark:text-slate-400 font-normal">
                ({reviewStats.total}) <ReviewStars rating={Math.round(reviewStats.promedio)} /> <span className="text-amber-400">{reviewStats.promedio}</span>
              </span>
            )}
          </h2>
          {reviews.length > 0 ? (
            <ul className="mt-5 space-y-4">
              {reviews.map((review) => (
                <li key={review.orderId} className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-700/70 dark:bg-slate-800/70">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-950 dark:text-slate-100">Orden {review.orderId.slice(0, 8)}</strong>
                    <ReviewStars rating={review.rating} />
                  </div>
                  {review.products.length > 0 ? (
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Producto: {review.products.join(', ')}
                    </div>
                  ) : null}
                  {review.description ? (
                    <p className="mt-2 text-sm text-slate-700 italic dark:text-slate-300">&ldquo;{review.description}&rdquo;</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-slate-600 dark:text-slate-400">No hay reseñas todavía.</p>
          )}
        </section>

        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/80">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Órdenes recientes</h2>
          {overview.orders.length > 0 ? (
            <ul className="mt-5 space-y-4">
              {overview.orders.map((order) => (
                <li key={order.id} className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-700/70 dark:bg-slate-800/70">
                  <strong className="block text-slate-950 dark:text-slate-100">Orden {order.id.slice(0, 8)}</strong>
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">Estado: {order.status}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total: ${order.total}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-slate-600 dark:text-slate-400">No hay órdenes cargadas.</p>
          )}
        </section>
      </div>
    </div>
  )
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-slate-500 dark:text-slate-400">Cargando...</div>}>
      <OverviewContent />
    </Suspense>
  )
}
