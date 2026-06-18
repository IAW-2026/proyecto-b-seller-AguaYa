/**
 * @file ToggleVendorButton.tsx
 * @description Botón que activa o desactiva un vendedor, adaptando la acción según el rol (admin o vendedor propio).
 */

'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { toggleVendorActiveStatus } from '@/app/actions/admin-vendor'
import { toggleMyVendorActiveStatus } from '@/app/actions/vendor'
import ToggleStatusButton from '@/components/ui/ToggleStatusButton'

interface ToggleVendorButtonProps {
  vendorId: string
  isActive: boolean
  vendorName: string
  role: 'admin' | 'vendor'
  size?: 'xs' | 'sm'
}

/** Renderiza un botón para alternar el estado activo/inactivo de un vendedor según el rol. */
export default function ToggleVendorButton({ vendorId, isActive, vendorName, role, size }: ToggleVendorButtonProps) {
  const router = useRouter()

  const handleToggle = async () => {
    if (role === 'admin') {
      await toggleVendorActiveStatus(vendorId)
    } else {
      await toggleMyVendorActiveStatus()
    }
    toast.success(isActive ? 'Vendedor desactivado correctamente' : 'Vendedor activado correctamente')
    router.refresh()
  }

  return (
    <ToggleStatusButton
      isActive={isActive}
      entityType="vendedor"
      entityName={vendorName}
      onToggle={handleToggle}
      size={size}
    />
  )
}
