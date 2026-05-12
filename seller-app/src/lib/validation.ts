export interface ProductInput {
  name: string
  description?: string
  price: number
  stock: number
  image?: string
}

export interface VendorInput {
  name: string
  address: string
  description?: string
  cuil?: string
  cuit?: string
}

export interface CreateOrderInput {
  externalId: string
  vendorId: string
  buyerId: string
  items: Array<{ productId: string; quantity: number }>
  total: number
}

type ProductDraft = {
  name: string
  description?: string
  price: string | number
  stock?: string | number
  image?: string
}

type VendorDraft = VendorInput

const ARGENTINE_TAX_ID_PATTERN = /^\d{2}-\d{8}-\d$/

function normalizeText(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function parseNumber(value: string | number, fieldName: string) {
  const parsed = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(parsed)) {
    throw new Error(`El campo ${fieldName} debe ser un número válido`)
  }

  return parsed
}

export function validateProductInput(data: ProductDraft): ProductInput {
  const name = data.name.trim()

  if (!name) {
    throw new Error('El nombre es obligatorio')
  }

  const price = parseNumber(data.price, 'precio')
  if (price <= 0) {
    throw new Error('El precio debe ser mayor a cero')
  }

  const stock = parseNumber(data.stock ?? 0, 'stock')
  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error('El stock debe ser un número entero mayor o igual a cero')
  }

  return {
    name,
    description: normalizeText(data.description),
    price,
    stock,
    image: normalizeText(data.image),
  }
}

export function validateVendorInput(data: VendorDraft): VendorInput {
  const name = data.name.trim()
  const address = data.address.trim()

  if (!name) {
    throw new Error('El nombre del negocio es obligatorio')
  }

  if (!address) {
    throw new Error('La dirección es obligatoria')
  }

  const cuil = normalizeText(data.cuil)
  const cuit = normalizeText(data.cuit)

  if (cuil && !ARGENTINE_TAX_ID_PATTERN.test(cuil)) {
    throw new Error('El CUIL debe tener el formato 20-12345678-9')
  }

  if (cuit && !ARGENTINE_TAX_ID_PATTERN.test(cuit)) {
    throw new Error('El CUIT debe tener el formato 30-12345678-9')
  }

  return {
    name,
    address,
    description: normalizeText(data.description),
    cuil,
    cuit,
  }
}

export function validateCreateOrderInput(data: unknown): CreateOrderInput {
  if (!data || typeof data !== 'object') {
    throw new Error('El payload debe ser un objeto JSON válido')
  }

  const d = data as Record<string, unknown>

  // Validar externalId
  if (typeof d.externalId !== 'string' || !d.externalId.trim()) {
    throw new Error('externalId es requerido y debe ser un string no vacío')
  }

  // Validar vendorId
  if (typeof d.vendorId !== 'string' || !d.vendorId.trim()) {
    throw new Error('vendorId es requerido y debe ser un string no vacío')
  }

  // Validar buyerId
  if (typeof d.buyerId !== 'string' || !d.buyerId.trim()) {
    throw new Error('buyerId es requerido y debe ser un string no vacío')
  }

  // Validar items
  if (!Array.isArray(d.items) || d.items.length === 0) {
    throw new Error('items es requerido y debe ser un array no vacío')
  }

  for (const item of d.items) {
    if (typeof item !== 'object' || item === null) {
      throw new Error('Cada item debe ser un objeto')
    }
    const it = item as Record<string, unknown>
    if (typeof it.productId !== 'string' || !it.productId.trim()) {
      throw new Error('Cada item debe tener productId string no vacío')
    }
    const qty = it.quantity
    if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1) {
      throw new Error('quantity debe ser un número entero >= 1')
    }
  }

  // Validar total
  if (typeof d.total !== 'number' || !Number.isFinite(d.total) || d.total <= 0) {
    throw new Error('total es requerido y debe ser un número positivo')
  }

  return {
    externalId: d.externalId.trim(),
    vendorId: d.vendorId.trim(),
    buyerId: d.buyerId.trim(),
    items: d.items.map((item: any) => ({
      productId: item.productId.trim(),
      quantity: item.quantity as number,
    })),
    total: d.total,
  }
}

/**
 * Valida e parsea un string de IDs de vendedor separados por comas.
 * Ej: "vendor-1,vendor-2,vendor-3" → ["vendor-1", "vendor-2", "vendor-3"]
 */
export function validateVendorIds(idsString: string | null | undefined): string[] {
  if (!idsString || typeof idsString !== 'string') {
    throw new Error("Parámetro 'ids' es requerido y debe ser un string")
  }

  const trimmed = idsString.trim()
  if (!trimmed) {
    throw new Error("Parámetro 'ids' no puede estar vacío. Usar: ?ids=id1,id2,id3")
  }

  const ids = trimmed.split(',').map((id) => id.trim()).filter((id) => id.length > 0)

  if (ids.length === 0) {
    throw new Error("Parámetro 'ids' debe contener al menos un ID válido. Usar: ?ids=id1,id2,id3")
  }

  return ids
}

/**
 * Valida e parsea parámetros de filtro para productos
 * vendorId: String de IDs separados por comas (opcional)
 * minPrice: Número mínimo de precio (opcional)
 * maxPrice: Número máximo de precio (opcional)
 */
export interface ProductFilterParams {
  vendorIds?: string[]
  minPrice?: number
  maxPrice?: number
}

export function validateProductFilters(params: Record<string, string | null>): ProductFilterParams {
  const result: ProductFilterParams = {}

  // Validar vendorId (opcional)
  if (params.vendorId) {
    try {
      result.vendorIds = validateVendorIds(params.vendorId)
    } catch (error) {
      throw new Error('Parámetro vendorId inválido: ' + (error instanceof Error ? error.message : 'error desconocido'))
    }
  }

  // Validar minPrice (opcional)
  if (params.minPrice) {
    const minPrice = parseFloat(params.minPrice)
    if (!Number.isFinite(minPrice) || minPrice < 0) {
      throw new Error('minPrice debe ser un número >= 0')
    }
    result.minPrice = minPrice
  }

  // Validar maxPrice (opcional)
  if (params.maxPrice) {
    const maxPrice = parseFloat(params.maxPrice)
    if (!Number.isFinite(maxPrice) || maxPrice < 0) {
      throw new Error('maxPrice debe ser un número >= 0')
    }
    result.maxPrice = maxPrice
  }

  // Validar lógica: minPrice <= maxPrice
  if (result.minPrice !== undefined && result.maxPrice !== undefined && result.minPrice > result.maxPrice) {
    throw new Error('minPrice no puede ser mayor que maxPrice')
  }

  return result
}
