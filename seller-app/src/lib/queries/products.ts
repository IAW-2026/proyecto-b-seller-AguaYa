import { prisma } from '@/lib/prisma'
import { paginate } from '@/lib/paginate'
import { buildSearchWhere } from '@/lib/search'
import type { Product } from '@prisma/client'

function buildProductOrderBy(sortBy?: string, sortOrder?: string) {
  const order = sortOrder === 'desc' ? 'desc' as const : 'asc' as const
  switch (sortBy) {
    case 'name': return { name: order }
    case 'vendor': return { vendor: { name: order } }
    case 'price': return { price: order }
    case 'stock': return { stock: order }
    case 'createdAt': return { createdAt: order }
    default: return { createdAt: 'desc' as const }
  }
}

export async function getProductById(productId: string, vendorId: string) {
  return prisma.product.findFirst({
    where: { id: productId, vendorId, deletedAt: null },
  })
}

function buildProductSearchWhere(q?: string) {
  if (!q) return {}
  return {
    OR: [
      { name: { contains: q, mode: 'insensitive' as const } },
      { description: { contains: q, mode: 'insensitive' as const } },
      { vendor: { name: { contains: q, mode: 'insensitive' as const } } },
    ],
  }
}

export async function listAllProductsPaginated(
  page: number = 1,
  filters?: {
    q?: string
    isActive?: boolean
    sortBy?: string
    sortOrder?: string
  }
) {
  return paginate<Product & { vendor: { id: string; name: string } }>(
    prisma.product,
    {
      deletedAt: null,
      ...buildProductSearchWhere(filters?.q),
      ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}),
    },
    {
      page,
      limit: 10,
      include: { vendor: { select: { name: true, id: true } } },
      orderBy: buildProductOrderBy(filters?.sortBy, filters?.sortOrder),
    }
  )
}


