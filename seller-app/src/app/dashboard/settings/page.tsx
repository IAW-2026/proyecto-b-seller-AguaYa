/**
 * settings/page.tsx — Página de configuración del perfil del vendedor.
 *
 * Muestra el formulario de edición del vendor con los datos actuales precargados.
 * Incluye subida de avatar, nombre, dirección, CUIL/CUIT y descripción.
 */

import React, { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { getVendorByUserId } from '@/lib/queries/vendors'
import VendorForm from '@/components/VendorForm'
import { Settings, Store } from 'lucide-react'

async function SettingsContent() {
  const { userId } = await auth()
  const vendor = userId ? await getVendorByUserId(userId) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Settings className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ajustes</h1>
          <p className="text-gray-600">Configuración del perfil del vendedor</p>
        </div>
      </div>

      {vendor ? (
        <>
          <div className="flex items-center gap-5 rounded-xl border border-slate-200/80 bg-white/80 p-5 shadow-sm xl:hidden">
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
              <h2 className="text-lg font-semibold text-slate-950">{vendor.name}</h2>
              <p className="text-sm text-slate-500">{vendor.address}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <VendorForm initialData={{
              name: vendor.name,
              address: vendor.address,
              description: vendor.description ?? undefined,
              image: vendor.image ?? undefined,
              cuil: vendor.cuil ?? undefined,
              cuit: vendor.cuit ?? undefined,
            }} redirectTo="/dashboard/settings" />
          </div>
        </>
      ) : (
        <p className="text-gray-500">No hay un vendedor asociado a esta cuenta.</p>
      )}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-slate-500">Cargando...</div>}>
      <SettingsContent />
    </Suspense>
  )
}
