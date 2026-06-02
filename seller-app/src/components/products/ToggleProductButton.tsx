/**
 * @file ToggleProductButton.tsx
 * @description Botón que activa o desactiva un producto llamando a la acción del servidor.
 */

'use client'

import { useRouter } from 'next/navigation'
import { toggleProductActiveStatus } from '@/app/actions/product'
import ToggleStatusButton from '@/components/ui/ToggleStatusButton'

interface ToggleProductButtonProps {
  productId: string
  isActive: boolean
  productName: string
  size?: 'xs' | 'sm'
}

/** Renderiza un botón para alternar el estado activo/inactivo de un producto. */
export default function ToggleProductButton({ productId, isActive, productName, size }: ToggleProductButtonProps) {
  const router = useRouter()

  const handleToggle = async () => {
    await toggleProductActiveStatus(productId)
    router.refresh()
  }

  return (
    <ToggleStatusButton
      isActive={isActive}
      entityType="producto"
      entityName={productName}
      onToggle={handleToggle}
      size={size}
    />
  )
}
