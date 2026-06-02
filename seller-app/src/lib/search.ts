/**
 * search.ts — Utilidad para construir cláusulas WHERE de búsqueda textual para Prisma.
 */

/**
 * Construye un filtro OR con búsqueda case-insensitive sobre los campos indicados.
 *
 * @param q - Texto de búsqueda. Si es undefined o vacío, retorna {}.
 * @param fields - Lista de campos de Prisma donde buscar.
 * @returns Cláusula WHERE de Prisma lista para usar en findMany/findFirst.
 */
export function buildSearchWhere(q: string | undefined, fields: string[]) {
  if (!q) return {}
  return {
    OR: fields.map((field) => ({
      [field]: { contains: q, mode: 'insensitive' as const },
    })),
  }
}
