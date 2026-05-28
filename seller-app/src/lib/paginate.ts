export type PaginatedResult<T> = {
  items: T[]
  total: number
  pageCount: number
}

export async function paginate<T>(
  delegate: { findMany: (args: any) => Promise<any[]>; count: (args: any) => Promise<number> },
  where: any,
  options: {
    page?: number
    limit?: number
    include?: any
    orderBy?: any
  } = {}
): Promise<PaginatedResult<T>> {
  const page = options.page ?? 1
  const limit = options.limit ?? 10
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
