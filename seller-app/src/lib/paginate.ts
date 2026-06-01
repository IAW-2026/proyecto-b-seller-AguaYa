export type PaginatedResult<T> = {
  items: T[]
  total: number
  pageCount: number
}

// Prisma model delegates have complex generic signatures; `any` is pragmatic here
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

export async function paginate<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delegate: { findMany: (args: any) => Promise<any[]>; count: (args: any) => Promise<number> },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  where: any,
  options: {
    page?: number
    limit?: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    include?: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orderBy?: any
  } = {}
): Promise<PaginatedResult<T>> {
  const page = options.page ?? 1
  const limit = options.limit ?? DEFAULT_PAGE_SIZE
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    delegate.findMany({
      where,
      include: options.include,
      orderBy: options.orderBy,
      skip,
      take: limit,
    }),
    delegate.count({ where }),
  ])

  return { items: items as T[], total, pageCount: Math.ceil(total / limit) }
}
