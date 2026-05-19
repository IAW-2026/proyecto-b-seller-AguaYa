import React, { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getVendorByUserId } from '@/lib/queries'
import DashboardSidebar from '@/components/layout/DashboardSidebar'

async function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const vendor = await getVendorByUserId(userId)

  if (!vendor) {
    redirect('/setup-vendor')
  }

  return (
    <div className="flex min-h-screen bg-transparent text-slate-900">
      <DashboardSidebar vendorName={vendor.name} vendorImage={vendor.image} />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
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
