import { ExternalLink, LayoutDashboard, Package, Settings, ShoppingCart, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavLinkDef = {
  href: string
  label: string
  icon: keyof typeof iconMap
  showFor: 'admin' | 'seller' | 'all'
  isExternal?: boolean
}

export const iconMap: Record<string, LucideIcon> = {
  ExternalLink,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Users,
}

export const dashboardLinks: NavLinkDef[] = [
  { href: '/dashboard/admin/vendors', label: 'Vendedores', icon: 'Users', showFor: 'admin' },
  { href: '/dashboard/overview', label: 'Resumen', icon: 'LayoutDashboard', showFor: 'seller' },
  { href: '/dashboard/products', label: 'Productos', icon: 'Package', showFor: 'all' },
  { href: '/dashboard/orders', label: 'Órdenes', icon: 'ShoppingCart', showFor: 'all' },
  { href: '/dashboard/settings', label: 'Ajustes', icon: 'Settings', showFor: 'all' },
]

export const feedbackLink: NavLinkDef = {
  href: '',
  label: 'Reseñas',
  icon: 'ExternalLink',
  showFor: 'seller',
  isExternal: true,
}
