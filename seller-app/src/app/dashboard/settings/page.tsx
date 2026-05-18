/**
 * settings/page.tsx — Página de configuración del perfil del vendedor.
 *
 * Muestra el formulario de edición del vendor con los datos actuales precargados.
 * Incluye subida de avatar, nombre, dirección, CUIL/CUIT y descripción.
 */

import React from 'react'
import { getVendorContext } from '@/lib/vendor-context'
import VendorForm from '@/components/VendorForm'
import { Settings } from 'lucide-react'

export default async function SettingsPage() {
  const { vendor } = await getVendorContext()

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
      ) : (
        <p className="text-gray-500">No hay un vendedor asociado a esta cuenta.</p>
      )}
    </div>
  )
}
