/**
 * Página raíz del dashboard (`/dashboard`). Redirige según el rol del usuario autenticado.
 */
import { redirect } from 'next/navigation'
import { getAuthRoles } from '@/lib/auth-utils'

/**
 * Redirige a `/dashboard/admin/vendors` si es admin, o a `/dashboard/overview` en caso contrario.
 */
export default async function DashboardPage() {
  const roles = await getAuthRoles()
  if (roles.includes('admin_seller')) redirect('/dashboard/admin/vendors')
  redirect('/dashboard/vendor/overview')
}
