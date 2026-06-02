/**
 * Página de detalle de un vendedor (panel admin).
 * Muestra pestañas con productos, órdenes PAID/READY y reseñas del vendedor.
 */
import React, { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdminPage } from '@/lib/admin-guard'
import { getVendorWithClerkInfo } from '@/app/actions/admin-vendor'
import { getVendorProductsPaginated } from '@/lib/queries/vendors'
import { getVendorOrdersByStatus } from '@/lib/queries/orders'
import { getVendorReviewsWithStats } from '@/lib/queries/reviews'
import VendorDetailTabs from '@/components/admin/VendorDetailTabs'

async function VendorDetailContent({
  id,
  searchParams,
}: {
  id: string
  searchParams: { product_page?: string; paid_page?: string; ready_page?: string }
}) {
  const productPage = parseInt(searchParams.product_page || '1', 10)
  const paidPage = parseInt(searchParams.paid_page || '1', 10)
  const readyPage = parseInt(searchParams.ready_page || '1', 10)

  const vendor = await getVendorWithClerkInfo(id)
  if (!vendor) redirect('/dashboard/admin/vendors')

  let reviewStats = { promedio: 0, total: 0, reviews: [] as import('@/lib/queries/reviews').Review[] }

  const [productsResult, paidOrdersResult, readyOrdersResult] = await Promise.all([
    getVendorProductsPaginated(id, productPage),
    getVendorOrdersByStatus(id, 'PAID', paidPage),
    getVendorOrdersByStatus(id, 'READY', readyPage),
  ])

  try {
    reviewStats = await getVendorReviewsWithStats(vendor.userId)
  } catch {
    console.warn('[VendorDetail] Error al cargar reseñas desde FeedbackApp')
  }

  const reviews = reviewStats.reviews

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
    <VendorDetailTabs
      vendor={{
        id: vendor.id,
        name: vendor.name,
        description: vendor.description,
        address: vendor.address,
        image: vendor.image,
        cuil: vendor.cuil,
        cuit: vendor.cuit,
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
          isActive: p.isActive,
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
      promedio={reviewStats.promedio}
      totalReviews={reviewStats.total}
    />
  )
}

/** Página de detalle de un vendedor con pestañas de productos, órdenes y reseñas. */
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

  return (
    <div>
      <Link
        href="/dashboard/admin/vendors"
        className="mb-4 inline-block text-sm text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
      >
        &larr; Volver a vendedores
      </Link>
      <Suspense fallback={<VendorDetailSkeleton />}>
        <VendorDetailContent id={id} searchParams={sp} />
      </Suspense>
    </div>
  )
}

function VendorDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-64 rounded-lg bg-slate-200/70" />
      <div className="h-4 w-48 rounded bg-slate-200/50" />

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        <div className="h-9 flex-1 rounded-lg bg-white" />
        <div className="h-9 flex-1 rounded-lg bg-slate-200/50" />
        <div className="h-9 flex-1 rounded-lg bg-slate-200/50" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-6">
          <div className="mb-4 h-5 w-44 rounded bg-slate-200/70" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-slate-200/40" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 p-6">
          <div className="mb-4 h-5 w-32 rounded bg-slate-200/70" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-slate-200/40" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
