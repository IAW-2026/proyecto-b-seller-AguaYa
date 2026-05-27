'use client'

import { useRouter } from 'next/navigation'
import Pagination from '@/components/Pagination'

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
