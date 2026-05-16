import React from 'react'
import Link from 'next/link'
import LogoutButton from '../LogoutButton'

export default function DashboardSidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200/80 bg-white/75 px-4 py-6 backdrop-blur xl:block">
      <div className="mb-6 rounded-2xl bg-slate-900 px-4 py-5 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-sky-200">AguaYa</p>
        <h2 className="mt-2 text-xl font-semibold">Seller Dashboard</h2>
        <p className="mt-2 text-sm text-slate-300">Administración de ventas, pedidos y catálogo.</p>
      </div>

      <nav aria-label="Navegación principal">
        <ul className="space-y-1 text-sm font-medium">
          <li><Link className="block rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950" href="/dashboard/overview">Overview</Link></li>
          <li><Link className="block rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950" href="/dashboard/sales">Sales</Link></li>
          <li><Link className="block rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950" href="/dashboard/products">Products</Link></li>
          <li><Link className="block rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950" href="/dashboard/orders">Orders</Link></li>
          <li><Link className="block rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950" href="/dashboard/settings">Settings</Link></li>
        </ul>
      </nav>

      <div className="my-6 h-px bg-slate-200" />
      <LogoutButton />
    </aside>
  )
}
