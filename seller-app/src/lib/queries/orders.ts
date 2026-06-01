import { prisma } from '@/lib/prisma'
import { paginate } from '@/lib/paginate'
import type { Order, OrderItem, Product } from '@prisma/client'

type OrderWithItems = Order & { items: (OrderItem & { product: Product })[] }
type OrderWithVendorAndItems = Order & { vendor: { name: string; id: string }; items: (OrderItem & { product: Product })[] }

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
  return paginate<OrderWithItems>(
    prisma.order,
    { vendorId, status, deletedAt: null },
    {
      page,
      limit: 4,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    }
  )
}

export async function listAllOrdersPaginated(page: number = 1) {
  return paginate<OrderWithVendorAndItems>(
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
