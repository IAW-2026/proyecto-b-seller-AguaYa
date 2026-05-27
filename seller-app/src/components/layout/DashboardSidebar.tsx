import React from 'react'
import Link from 'next/link'
import { Package, ShoppingCart, LayoutDashboard, Users } from 'lucide-react'
import LogoutButton from '../LogoutButton'

export default function DashboardSidebar({
  vendorName,
  vendorImage,
  roles,
}: {
  vendorName: string
  vendorImage?: string | null
  roles?: string[]
}) {
  const isAdmin = roles?.includes('admin_seller')

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200/80 bg-white/75 px-4 py-6 backdrop-blur xl:block">
      <div className="mb-6 rounded-2xl bg-slate-900 px-4 py-5 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-sky-200">AguaYa</p>
        <h2 className="mt-2 text-xl font-semibold">Seller Dashboard</h2>
        <p className="mt-2 text-sm text-slate-300">Administración de ventas, pedidos y catálogo.</p>
      </div>

      <nav aria-label="Navegación principal">
        <ul className="space-y-1 text-sm font-medium">
          {isAdmin && (
            <li>
              <Link className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950" href="/dashboard/admin/vendors">
                <Users className="h-4 w-4" />
                Vendedores
              </Link>
            </li>
          )}
          {!isAdmin && (
            <li>
              <Link className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950" href="/dashboard/overview">
                <LayoutDashboard className="h-4 w-4" />
                Overview
              </Link>
            </li>
          )}
          <li>
            <Link className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950" href="/dashboard/products">
              <Package className="h-4 w-4" />
              Products
            </Link>
          </li>
          <li>
            <Link className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950" href="/dashboard/orders">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </Link>
          </li>
        </ul>
      </nav>

      <div className="my-6 h-px bg-slate-200" />

      <Link
        href="/dashboard/settings"
        className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-100"
      >
        {vendorImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vendorImage}
            alt={vendorName}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-300 text-sm font-semibold text-white">
            {vendorName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-slate-700">{vendorName}</span>
      </Link>

      <div className="my-4 h-px bg-slate-200" />
      <LogoutButton />
    </aside>
  )
}
