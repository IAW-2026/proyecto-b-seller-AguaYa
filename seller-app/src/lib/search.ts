export function buildSearchWhere(q: string | undefined, fields: string[]) {
  if (!q) return {}
  return {
    OR: fields.map((field) => ({
      [field]: { contains: q, mode: 'insensitive' as const },
    })),
  }
}
