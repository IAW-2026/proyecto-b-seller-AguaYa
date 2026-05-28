import React, { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getVendorByUserId } from '@/lib/queries/vendors'
import { getAuthRoles } from '@/lib/auth-utils'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import MobileBottomNav from '@/components/layout/MobileBottomNav'

async function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const roles = await getAuthRoles()
  const isAdmin = roles.includes('admin_seller')
  const vendor = await getVendorByUserId(userId)

  if (!vendor && !isAdmin) {
    redirect('/setup-vendor')
  }

  if (!vendor && isAdmin) {
    redirect('/dashboard/admin/vendors')
  }

  return (
    <div className="flex min-h-screen bg-transparent text-slate-900">
      <DashboardSidebar vendorName={vendor!.name} vendorImage={vendor!.image} roles={roles} />
      <main className="flex-1 px-4 py-6 pb-20 sm:px-6 lg:px-10 lg:py-8 lg:pb-6">{children}</main>
      <MobileBottomNav roles={roles} />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-500">Cargando...</div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  )
}
