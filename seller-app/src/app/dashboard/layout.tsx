/**
 * Layout del dashboard. Verifica autenticación, existencia del vendedor, y renderiza sidebar + navegación inferior.
 */
import React, { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getVendorByUserId } from '@/lib/queries/vendors'
import { getAuthRoles } from '@/lib/auth-utils'
import { Toaster } from 'sonner'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import MobileBottomNav from '@/components/layout/MobileBottomNav'

/**
 * Contenido del layout con lógica de autenticación y datos del vendedor.
 */
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

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="flex h-screen bg-transparent text-slate-900 dark:text-slate-100">
      <DashboardSidebar vendorName={vendor?.name ?? null} vendorImage={vendor?.image ?? null} roles={roles} feedbackAppUrl={process.env.FEEDBACK_APP_URL} />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-20 sm:px-6 lg:px-10 lg:py-8 lg:pb-6">{children}</main>
      <MobileBottomNav roles={roles} feedbackAppUrl={process.env.FEEDBACK_APP_URL} />
    </div>
    </>
  )
}

/**
 * Layout principal del dashboard envuelto en un Suspense con indicador de carga.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-500 dark:text-slate-400">Cargando...</div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  )
}
