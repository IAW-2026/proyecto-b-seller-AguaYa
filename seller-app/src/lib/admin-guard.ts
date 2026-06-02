/**
 * admin-guard.ts — Guard de ruta para páginas de administración.
 *
 * Redirige al usuario a /dashboard/overview si no tiene rol admin_seller.
 * Debe usarse en Server Components de páginas protegidas.
 */
import { redirect } from 'next/navigation'
import { getAuthRoles } from '@/lib/auth-utils'

/** Redirige a /dashboard/overview si el usuario no es admin_seller. */
export async function requireAdminPage() {
  const roles = await getAuthRoles()
  if (!roles.includes('admin_seller')) {
    redirect('/dashboard/overview')
  }
}
