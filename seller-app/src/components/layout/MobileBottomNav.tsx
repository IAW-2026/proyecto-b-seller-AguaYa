'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
import { ExternalLink, Package, ShoppingCart, LayoutDashboard, Settings, Users, LogOut } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  disabled?: boolean
}

export default function MobileBottomNav({ roles, feedbackAppUrl }: { roles?: string[]; feedbackAppUrl?: string }) {
  const pathname = usePathname()
  const isAdmin = roles?.includes('admin_seller')

  const items: NavItem[] = []

  if (!isAdmin) {
    items.push({ href: '/dashboard/overview', label: 'Resumen', icon: <LayoutDashboard className="h-5 w-5" /> })
  }
  items.push({ href: '/dashboard/products', label: 'Productos', icon: <Package className="h-5 w-5" /> })
  items.push({ href: '/dashboard/orders', label: 'Órdenes', icon: <ShoppingCart className="h-5 w-5" /> })
  if (!isAdmin) {
    items.push({ href: feedbackAppUrl || '#', label: 'Reseñas', icon: <ExternalLink className="h-5 w-5" />, disabled: !feedbackAppUrl })
  }
  if (isAdmin) {
    items.push({ href: '/dashboard/admin/vendors', label: 'Vendedores', icon: <Users className="h-5 w-5" /> })
  }
  items.push({ href: '/dashboard/settings', label: 'Ajustes', icon: <Settings className="h-5 w-5" /> })

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 xl:hidden">
      <ul className="flex justify-around py-2">
        {items.map((item) => {
          const isActive = !item.disabled && pathname.startsWith(item.href)
          return (
            <li key={item.href}>
              {item.disabled ? (
                <span
                  className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium text-slate-400 cursor-not-allowed opacity-50 dark:text-slate-600"
                  title="No disponible: falta configurar la URL de FeedbackApp"
                >
                  {item.icon}
                  {item.label}
                </span>
              ) : item.href.startsWith('http') ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {item.icon}
                  {item.label}
                </a>
              ) : (
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors ${
                    isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
        <li>
          <SignOutButton>
            <button className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" aria-label="Cerrar sesión">
              <LogOut className="h-5 w-5" />
              Salir
            </button>
          </SignOutButton>
        </li>
      </ul>
    </nav>
  )
}
