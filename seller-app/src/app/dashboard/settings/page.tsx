/**
 * Página de configuración del vendedor (`/dashboard/settings`). Permite editar perfil y cambiar tema en mobile.
 */
import React from 'react'
import { auth } from '@clerk/nextjs/server'
import { getVendorByUserId } from '@/lib/queries/vendors'
import { getAuthRoles } from '@/lib/auth-utils'
import VendorForm from '@/components/VendorForm'
import ThemeToggle from '@/components/layout/ThemeToggle'
import { Settings, Store, Moon } from 'lucide-react'

/**
 * Renderiza el formulario de edición del vendedor y el toggle de tema (solo en mobile/tablet).
 */
export default async function SettingsPage() {
  const { userId } = await auth()
  const vendor = userId ? await getVendorByUserId(userId) : null
  const roles = await getAuthRoles()
  const isAdmin = roles.includes('admin_seller')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
          <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ajustes</h1>
          <p className="text-gray-600 dark:text-slate-400">Configuración del perfil del vendedor</p>
        </div>
      </div>

      {vendor ? (
        <>
          <div className="flex items-center gap-5 rounded-xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80 xl:hidden">
            {vendor.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vendor.image}
                alt={vendor.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200">
                <Store className="h-7 w-7 text-slate-500" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">{vendor.name}</h2>
              {!isAdmin && <p className="text-sm text-slate-500 dark:text-slate-400">{vendor.address}</p>}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-700">
            <VendorForm initialData={{
              name: vendor.name,
              address: vendor.address,
              description: vendor.description ?? undefined,
              image: vendor.image ?? undefined,
              cuil: vendor.cuil ?? undefined,
              cuit: vendor.cuit ?? undefined,
            }} redirectTo="/dashboard/settings" simple={isAdmin} />
          </div>

          {/* Theme toggle — solo visible en mobile/tablet */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80 xl:hidden">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                <Moon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Apariencia</p>
                <p className="text-xs text-slate-600 dark:text-slate-500">Cambiar entre modo claro y oscuro</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </>
      ) : (
        <p className="text-gray-500 dark:text-slate-400">No hay un vendedor asociado a esta cuenta.</p>
      )}
    </div>
  )
}
