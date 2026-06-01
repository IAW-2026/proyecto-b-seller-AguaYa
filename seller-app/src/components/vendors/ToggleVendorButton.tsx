'use client'

import { useRouter } from 'next/navigation'
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

export default function ToggleVendorButton({ vendorId, isActive, vendorName, role, size }: ToggleVendorButtonProps) {
  const router = useRouter()

  const handleToggle = async () => {
    if (role === 'admin') {
      await toggleVendorActiveStatus(vendorId)
    } else {
      await toggleMyVendorActiveStatus()
    }
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
