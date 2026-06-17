/**
 * paginate.ts — Utilidad de paginación genérica para Prisma.
 *
 * Ejecuta una consulta paginada (findMany + count) en paralelo,
 * retornando los items de la página solicitada y el total de páginas.
 */

import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

/** Resultado de una consulta paginada. */
export type PaginatedResult<T> = {
  items: T[]
  total: number
  pageCount: number
}

/**
 * Ejecuta una consulta paginada sobre un modelo de Prisma.
 *
 * @param delegate - Objeto Prisma con findMany y count (ej. prisma.product, prisma.order).
 * @param where - Filtro WHERE de Prisma.
 * @param options.page - Número de página (default: 1).
 * @param options.limit - Items por página (default: 10).
 * @param options.include - Relaciones a incluir.
 * @param options.orderBy - Ordenamiento.
 * @returns Items de la página y metadatos de paginación.
 */
export async function paginate<T>(
  delegate: { findMany: (args: any) => Promise<any[]>; count: (args: any) => Promise<number> },
  where: Record<string, unknown>,
  options: {
    page?: number
    limit?: number
    include?: any
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
