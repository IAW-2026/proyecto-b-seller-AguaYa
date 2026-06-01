import React, { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { getVendorOverview } from '@/lib/queries/vendors'
import { getVendorReviewsWithStats } from '@/lib/queries/reviews'

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
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Overview</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">No existe un vendedor asociado a esta cuenta todavía.</h1>
        <p className="text-slate-600">Cuando registres el perfil del vendedor, acá vas a ver sus métricas, productos y órdenes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
        <strong className="text-lg text-slate-950">{overview.name}</strong>
        <div className="mt-3 text-sm text-slate-600">{overview.address}</div>
        {overview.description ? <div className="mt-2 text-sm text-slate-600">{overview.description}</div> : null}

      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm">
          <strong className="text-sm uppercase tracking-wide text-slate-500">Productos</strong>
          <div className="mt-3 text-3xl font-semibold text-slate-950">{overview._count.products}</div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm">
          <strong className="text-sm uppercase tracking-wide text-slate-500">Órdenes</strong>
          <div className="mt-3 text-3xl font-semibold text-slate-950">{overview._count.orders}</div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm">
          <strong className="text-sm uppercase tracking-wide text-slate-500">Estado</strong>
          <div className="mt-3 text-2xl font-semibold text-emerald-600">Activo</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
          <h2 className="text-xl font-semibold text-slate-950">
            Reseñas {reviewStats.total > 0 && (
              <span className="text-lg text-slate-500 font-normal">
                ({reviewStats.total}) <ReviewStars rating={Math.round(reviewStats.promedio)} /> <span className="text-amber-400">{reviewStats.promedio}</span>
              </span>
            )}
          </h2>
          {reviews.length > 0 ? (
            <ul className="mt-5 space-y-4">
              {reviews.map((review) => (
                <li key={review.orderId} className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-950">Orden {review.orderId.slice(0, 8)}</strong>
                    <ReviewStars rating={review.rating} />
                  </div>
                  {review.products.length > 0 ? (
                    <div className="mt-1 text-sm text-slate-600">
                      Producto: {review.products.join(', ')}
                    </div>
                  ) : null}
                  {review.description ? (
                    <p className="mt-2 text-sm text-slate-700 italic">&ldquo;{review.description}&rdquo;</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-slate-600">No hay reseñas todavía.</p>
          )}
        </section>

        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
          <h2 className="text-xl font-semibold text-slate-950">Órdenes recientes</h2>
          {overview.orders.length > 0 ? (
            <ul className="mt-5 space-y-4">
              {overview.orders.map((order) => (
                <li key={order.id} className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
                  <strong className="block text-slate-950">Orden {order.id.slice(0, 8)}</strong>
                  <div className="mt-2 text-sm text-slate-600">Estado: {order.status}</div>
                  <div className="text-sm text-slate-600">Total: ${order.total}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-slate-600">No hay órdenes cargadas.</p>
          )}
        </section>
      </div>
    </div>
  )
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-slate-500">Cargando...</div>}>
      <OverviewContent />
    </Suspense>
  )
}
