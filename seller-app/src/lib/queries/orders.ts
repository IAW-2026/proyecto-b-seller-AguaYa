import { prisma } from '@/lib/prisma'
import { paginate } from '@/lib/paginate'
import type { PaginatedResult } from '@/lib/paginate'
import type { Order } from '@prisma/client'

export async function getVendorOrders(vendorId: string) {
  return prisma.order.findMany({
    where: { vendorId, deletedAt: null },
    include: {
      items: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getVendorOrdersByStatus(
  vendorId: string,
  status: 'PAID' | 'READY',
  page: number = 1
) {
  return paginate(
    prisma.order,
    { vendorId, status, deletedAt: null },
    {
      page,
      limit: 10,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    }
  )
}

export async function listAllOrdersPaginated(page: number = 1) {
  return paginate(
    prisma.order,
    { deletedAt: null },
    {
      page,
      limit: 10,
      include: {
        vendor: { select: { name: true, id: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    }
  )
}
