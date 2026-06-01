export type Vendor = {
  id: string
  name: string
  description: string | null
  address: string
  image: string | null
  cuil: string | null
  cuit: string | null
  clerkName: string
  clerkEmail: string
  isActive: boolean
}

export type Product = {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  image: string | null
  isActive: boolean
}

export type OrderItem = {
  productName: string
  productPrice: number
  quantity: number
}

export type Order = {
  id: string
  externalId: string
  status: string
  total: number
  address: string | null
  createdAt: string
  buyerId: string
  items: OrderItem[]
}

export type Review = {
  orderId: string
  rating: number
  description?: string
  createdAt: string
  products: string[]
}

export type Paginated<T> = {
  items: T[]
  page: number
  pageCount: number
}
