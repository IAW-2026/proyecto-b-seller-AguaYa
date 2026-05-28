import { prisma } from '@/lib/prisma'
import { paginate } from '@/lib/paginate'
import type { PaginatedResult } from '@/lib/paginate'
import type { Product } from '@prisma/client'

export async function getProductById(productId: string, vendorId: string) {
  return prisma.product.findFirst({
    where: { id: productId, vendorId, deletedAt: null },
  })
}

export async function listAllProductsPaginated(page: number = 1) {
  return paginate<Product & { vendor: { id: string; name: string } }>(
    prisma.product,
    { deletedAt: null },
    {
      page,
      limit: 10,
      include: { vendor: { select: { name: true, id: true } } },
      orderBy: { createdAt: 'desc' },
    }
  )
}
