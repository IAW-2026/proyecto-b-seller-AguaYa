import { redirect } from 'next/navigation'
import { getAuthRoles } from '@/lib/auth-utils'

export default async function DashboardPage() {
  const roles = await getAuthRoles()
  if (roles.includes('admin_seller')) redirect('/dashboard/admin/vendors')
  redirect('/dashboard/overview')
}
