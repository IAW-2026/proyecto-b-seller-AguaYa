/**
 * navigation.ts — Definición centralizada de los links de navegación del dashboard.
 *
 * Separa la configuración de los links por rol (admin, seller, all) para
 * que los componentes de navegación (sidebar, bottom nav) consuman esta
 * configuración sin duplicar rutas.
 */
import { ExternalLink, LayoutDashboard, Package, Settings, ShoppingCart, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** Definición de un link de navegación del dashboard. */
export type NavLinkDef = {
  href: string
  label: string
  icon: keyof typeof iconMap
  showFor: 'admin' | 'seller' | 'all'
  isExternal?: boolean
}

/** Mapa que relaciona nombres de iconos con componentes Lucide. */
export const iconMap: Record<string, LucideIcon> = {
  ExternalLink,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Users,
}

/** Links del dashboard clasificados por visibilidad según el rol. */
export const dashboardLinks: NavLinkDef[] = [
  { href: '/dashboard/admin/vendors', label: 'Vendedores', icon: 'Users', showFor: 'admin' },
  { href: '/dashboard/overview', label: 'Resumen', icon: 'LayoutDashboard', showFor: 'seller' },
  { href: '/dashboard/products', label: 'Productos', icon: 'Package', showFor: 'all' },
  { href: '/dashboard/orders', label: 'Órdenes', icon: 'ShoppingCart', showFor: 'all' },
  { href: '/dashboard/settings', label: 'Ajustes', icon: 'Settings', showFor: 'all' },
]

/** Link externo a FeedbackApp para que el vendedor vea reseñas. */
export const feedbackLink: NavLinkDef = {
  href: '',
  label: 'Reseñas',
  icon: 'ExternalLink',
  showFor: 'seller',
  isExternal: true,
}
