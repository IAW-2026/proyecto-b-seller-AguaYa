import { redirect } from 'next/navigation'
import { getAuthRoles } from '@/lib/auth-utils'

export async function requireAdminPage() {
  const roles = await getAuthRoles()
  if (!roles.includes('admin_seller')) {
    redirect('/dashboard/overview')
  }
}
