'use client'

import { useRouter } from 'next/navigation'
import { deleteVendorAsAdmin } from '@/actions/admin-vendor'

export default function DeleteVendorButton({ vendorId, vendorName }: { vendorId: string; vendorName: string }) {
  const router = useRouter()

  const handleClick = async () => {
    if (!window.confirm(`¿Desactivar a ${vendorName}?`)) return
    await deleteVendorAsAdmin(vendorId)
    router.refresh()
  }

  return (
    <button onClick={handleClick} className="text-sm text-red-500 hover:text-red-700">
      Desactivar
    </button>
  )
}
