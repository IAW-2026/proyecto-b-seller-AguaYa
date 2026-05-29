import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdminPage } from '@/lib/admin-guard'
import { getVendorWithClerkInfo } from '@/app/actions/admin-vendor'
import { getVendorProductsPaginated } from '@/lib/queries/vendors'
import { getVendorOrdersByStatus } from '@/lib/queries/orders'
import { getVendorReviews } from '@/lib/queries/reviews'
import VendorDetailTabs from '@/components/admin/VendorDetailTabs'
import RefreshPageButton from '@/components/admin/RefreshPageButton'

function mapOrder(o: any) {
  return {
    id: o.id,
    externalId: o.externalId,
    status: o.status,
    total: o.total,
    address: o.address,
    createdAt: o.createdAt.toISOString(),
    buyerId: o.buyerId,
    items: o.items.map((i: any) => ({
      productName: i.productName,
      productPrice: i.productPrice,
      quantity: i.quantity,
    })),
  }
}

export default async function VendorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ product_page?: string; paid_page?: string; ready_page?: string }>
}) {
  await requireAdminPage()

  const { id } = await params
  const vendor = await getVendorWithClerkInfo(id)

  if (!vendor) redirect('/dashboard/admin/vendors')

  const { product_page, paid_page, ready_page } = await searchParams
  const productPage = parseInt(product_page || '1', 10)
  const paidPage = parseInt(paid_page || '1', 10)
  const readyPage = parseInt(ready_page || '1', 10)

  const [productsResult, paidResult, readyResult, reviews] = await Promise.all([
    getVendorProductsPaginated(id, productPage),
    getVendorOrdersByStatus(id, 'PAID', paidPage),
    getVendorOrdersByStatus(id, 'READY', readyPage),
    getVendorReviews(vendor.userId),
  ])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/dashboard/admin/vendors"
          className="inline-block text-sm text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
        >
          &larr; Volver a vendedores
        </Link>
        <RefreshPageButton />
      </div>

      <VendorDetailTabs
        vendor={vendor}
        products={productsResult.items.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          image: p.image,
        }))}
        productsPage={productPage}
        productsPageCount={productsResult.pageCount}
        productsTotal={productsResult.total}
        paidOrders={paidResult.items.map(mapOrder)}
        paidPage={paidPage}
        paidPageCount={paidResult.pageCount}
        paidTotal={paidResult.total}
        readyOrders={readyResult.items.map(mapOrder)}
        readyPage={readyPage}
        readyPageCount={readyResult.pageCount}
        readyTotal={readyResult.total}
        reviews={reviews}
      />
    </div>
  )
}
