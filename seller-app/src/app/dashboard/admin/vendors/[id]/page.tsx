import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdminPage } from '@/lib/admin-guard'
import { getVendorWithClerkInfo } from '@/app/actions/admin-vendor'
import { getVendorProductsPaginated } from '@/lib/queries/vendors'
import { getVendorOrdersByStatus } from '@/lib/queries/orders'
import { getVendorReviews } from '@/lib/queries/reviews'
import VendorDetailTabs from '@/components/admin/VendorDetailTabs'

export default async function VendorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ product_page?: string; paid_page?: string; ready_page?: string }>
}) {
  await requireAdminPage()

  const { id } = await params
  const sp = await searchParams

  const productPage = parseInt(sp.product_page || '1', 10)
  const paidPage = parseInt(sp.paid_page || '1', 10)
  const readyPage = parseInt(sp.ready_page || '1', 10)

  const vendor = await getVendorWithClerkInfo(id)
  if (!vendor) redirect('/dashboard/admin/vendors')

  const [productsResult, paidOrdersResult, readyOrdersResult, reviews] = await Promise.all([
    getVendorProductsPaginated(id, productPage),
    getVendorOrdersByStatus(id, 'PAID', paidPage),
    getVendorOrdersByStatus(id, 'READY', readyPage),
    getVendorReviews(vendor.userId),
  ])

  const mapOrder = (o: typeof paidOrdersResult.items[0]) => ({
    id: o.id,
    externalId: o.externalId,
    status: o.status,
    total: o.total,
    address: o.address,
    createdAt: o.createdAt.toISOString(),
    buyerId: o.buyerId,
    items: o.items.map((i) => ({
      productName: i.productName,
      productPrice: i.productPrice,
      quantity: i.quantity,
    })),
  })

  return (
    <div>
      <Link
        href="/dashboard/admin/vendors"
        className="mb-4 inline-block text-sm text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
      >
        &larr; Volver a vendedores
      </Link>

      <VendorDetailTabs
        vendor={{
          id: vendor.id,
          name: vendor.name,
          description: vendor.description,
          address: vendor.address,
          image: vendor.image,
          cuil: vendor.cuil,
          cuit: vendor.cuit,
          reputation: vendor.reputation,
          clerkName: vendor.clerkName,
          clerkEmail: vendor.clerkEmail,
          isActive: vendor.isActive,
        }}
        products={{
          items: productsResult.items.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            stock: p.stock,
            image: p.image,
          })),
          page: productPage,
          pageCount: productsResult.pageCount,
        }}
        paidOrders={{
          items: paidOrdersResult.items.map(mapOrder),
          page: paidPage,
          pageCount: paidOrdersResult.pageCount,
        }}
        readyOrders={{
          items: readyOrdersResult.items.map(mapOrder),
          page: readyPage,
          pageCount: readyOrdersResult.pageCount,
        }}
        reviews={reviews}
      />
    </div>
  )
}
