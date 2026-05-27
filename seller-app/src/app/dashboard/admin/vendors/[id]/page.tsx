import React from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAuthRoles } from '@/lib/auth-utils'
import { getVendorWithClerkInfo } from '@/app/actions/admin-vendor'
import { getVendorProducts, getVendorOrders, getVendorReviews } from '@/lib/queries'
import VendorDetailTabs from '@/components/admin/VendorDetailTabs'

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const roles = await getAuthRoles()
  if (!roles.includes('admin_seller')) redirect('/dashboard/overview')

  const { id } = await params
  const vendor = await getVendorWithClerkInfo(id)

  if (!vendor) redirect('/dashboard/admin/vendors')

  const [productsResult, orders, reviews] = await Promise.all([
    getVendorProducts(id),
    getVendorOrders(id),
    getVendorReviews(vendor.userId),
  ])

  const products = productsResult?.products ?? []

  return (
    <div>
      <Link
        href="/dashboard/admin/vendors"
        className="mb-4 inline-block text-sm text-sky-600 hover:text-sky-500"
      >
        &larr; Volver a vendedores
      </Link>

      <VendorDetailTabs
        vendor={vendor}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          image: p.image,
        }))}
        orders={orders.map((o) => ({
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
        }))}
        reviews={reviews}
      />
    </div>
  )
}
