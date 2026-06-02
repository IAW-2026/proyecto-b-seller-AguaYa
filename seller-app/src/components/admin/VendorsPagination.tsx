/**
 * Componente de paginación para la lista de vendedores en el panel de administración.
 * Navega a /dashboard/admin/vendors con el parámetro de página correspondiente.
 */
'use client'

import { useRouter } from 'next/navigation'
import Pagination from '@/components/Pagination'

/** Paginación para la lista de vendedores. */
export default function VendorsPagination({ page, pageCount }: { page: number; pageCount: number }) {
  const router = useRouter()

  return (
    <Pagination
      page={page}
      pageCount={pageCount}
      onPageChange={(p) => router.push(`/dashboard/admin/vendors${p === 1 ? '' : `?page=${p}`}`)}
    />
  )
}
