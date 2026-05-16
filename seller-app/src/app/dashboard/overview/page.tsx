import React from 'react'
import { getVendorContext } from '@/lib/vendor-context'
import { getCachedOverview } from '@/lib/cache'

export default async function OverviewPage() {
  const { vendor } = await getVendorContext()

  if (!vendor) {
    return null
  }

  const overview = await getCachedOverview(vendor.id)

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
        <div className="mt-2 text-sm text-slate-600">Reputación: {overview.reputation}</div>
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
          <h2 className="text-xl font-semibold text-slate-950">Productos recientes</h2>
          {overview.products.length > 0 ? (
            <ul className="mt-5 space-y-4">
              {overview.products.map((product) => (
                <li key={product.id} className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
                  <strong className="block text-slate-950">{product.name}</strong>
                  <div className="mt-2 text-sm text-slate-600">Precio: ${product.price}</div>
                  <div className="text-sm text-slate-600">Stock: {product.stock}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-slate-600">No hay productos cargados.</p>
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
