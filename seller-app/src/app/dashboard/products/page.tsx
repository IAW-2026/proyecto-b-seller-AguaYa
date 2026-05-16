import React from 'react'
import Link from 'next/link'
import { getVendorContext } from '@/lib/vendor-context'
import { getCachedVendorProducts } from '@/lib/cache'

export default async function ProductsPage() {
  const { vendor } = await getVendorContext()
  if (!vendor) return null

  const productsVendor = await getCachedVendorProducts(vendor.id)

  if (!productsVendor) {
    return (
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Products</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">No existe un vendedor asociado a esta cuenta.</h1>
        <p className="text-slate-600">Registrá tu negocio primero para empezar a administrar el catálogo.</p>
        <Link className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800" href="/setup-vendor">Registrar negocio</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Products</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Catálogo de productos</h1>
        </div>
        <Link className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800" href="/dashboard/products/new">+ Nuevo producto</Link>
      </div>

      {productsVendor.products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-slate-600">No tienes productos aún.</p>
      ) : (
        <ul className="space-y-4">
          {productsVendor.products.map((p) => (
            <li key={p.id} className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <strong className="text-lg text-slate-950">{p.name}</strong>
                  <div className="mt-2 text-sm text-slate-600">Precio: ${p.price}</div>
                  <div className="text-sm text-slate-600">Stock: {p.stock}</div>
                </div>
                <div>
                  <Link className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950" href={`/dashboard/products/${p.id}`}>Editar</Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
