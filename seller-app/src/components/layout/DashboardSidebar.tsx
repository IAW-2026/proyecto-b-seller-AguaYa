import React from 'react'
import Link from 'next/link'
import { ExternalLink, Package, ShoppingCart, LayoutDashboard, Users } from 'lucide-react'
import LogoutButton from '../LogoutButton'
import ThemeToggle from './ThemeToggle'

export default function DashboardSidebar({
  vendorName,
  vendorImage,
  roles,
  feedbackAppUrl,
}: {
  vendorName: string | null
  vendorImage?: string | null
  roles?: string[]
  feedbackAppUrl?: string
}) {
  const isAdmin = roles?.includes('admin_seller')

  return (
    <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-slate-200/80 bg-white/75 px-4 py-6 backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 xl:block">
      <div className="mb-6 rounded-2xl bg-slate-900 px-4 py-5 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-sky-200">AguaYa</p>
        <h2 className="mt-2 text-xl font-semibold">Panel de Control</h2>
        <p className="mt-2 text-sm text-slate-300">Gestiona tus productos y pedidos con suma facilidad.</p>
      </div>

      <nav aria-label="Navegación principal">
        <ul className="space-y-1 text-sm font-medium">
          {isAdmin && (
            <li>
              <Link className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100" href="/dashboard/admin/vendors">
                <Users className="h-4 w-4" />
                Vendedores
              </Link>
            </li>
          )}
          {!isAdmin && (
            <li>
              <Link className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100" href="/dashboard/overview">
                <LayoutDashboard className="h-4 w-4" />
                Resumen
              </Link>
            </li>
          )}
          <li>
            <Link className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100" href="/dashboard/products">
              <Package className="h-4 w-4" />
              Productos
            </Link>
          </li>
          <li>
            <Link className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100" href="/dashboard/orders">
              <ShoppingCart className="h-4 w-4" />
              Órdenes
            </Link>
          </li>
          {!isAdmin && feedbackAppUrl && (
            <li>
              <a
                href={feedbackAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <ExternalLink className="h-4 w-4" />
                Reseñas
              </a>
            </li>
          )}
        </ul>
      </nav>

      <div className="my-6 h-px bg-slate-200 dark:bg-slate-700" />

      <Link
        href="/dashboard/settings"
        className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        {vendorName ? (
          vendorImage ? (
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
          )
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
            A
          </div>
        )}
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{vendorName ?? 'Admin'}</span>
      </Link>

      <div className="my-4 h-px bg-slate-200 dark:bg-slate-700" />
      <div className="flex items-center justify-between">
        <ThemeToggle />
        <LogoutButton />
      </div>
    </aside>
  )
}
