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