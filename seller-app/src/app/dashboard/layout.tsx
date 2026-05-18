import React from 'react'
import { redirect } from 'next/navigation'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import { getVendorContext } from '@/lib/vendor-context'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId, vendor } = await getVendorContext()

  if (!userId) {
    redirect('/sign-in')
  }

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
