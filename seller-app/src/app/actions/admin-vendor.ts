'use server'

import { clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAuthRoles } from '@/lib/auth-utils'
import { validateVendorInput, validateProductInput, validateVendorUpdateInput } from '@/lib/validation'

async function requireAdmin() {
  const roles = await getAuthRoles()
  if (!roles.includes('admin_seller')) throw new Error('No autorizado')
}

export async function getAvailableClerkUsers(): Promise<{ id: string; name: string; email: string }[]> {
  await requireAdmin()

  const client = await clerkClient()
  const { data: clerkUsers } = await client.users.getUserList({ limit: 500 })

  const usedUserIds = (await prisma.vendor.findMany({
    where: { deletedAt: null },
    select: { userId: true },
  })).map((v) => v.userId)

  return clerkUsers
    .filter((u) => !usedUserIds.includes(u.id))
    .map((u) => ({
      id: u.id,
      name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.emailAddresses[0]?.emailAddress || u.id,
      email: u.emailAddresses[0]?.emailAddress || '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getVendorsWithClerkInfo() {
  await requireAdmin()

  const vendors = await prisma.vendor.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  const client = await clerkClient()
  const { data: clerkUsers } = await client.users.getUserList({ limit: 500 })
  const clerkMap = new Map(clerkUsers.map((u) => [u.id, u]))

  return vendors.map((v) => {
    const clerkUser = clerkMap.get(v.userId)
    return {
      ...v,
      clerkName: clerkUser ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || '' : '',
      clerkEmail: clerkUser?.emailAddresses?.[0]?.emailAddress || '',
    }
  })
}

export async function getVendorsWithClerkInfoPaginated(
  page: number = 1,
  filters?: { q?: string; sortBy?: string; sortOrder?: string }
) {
  await requireAdmin()

  const { listAllVendors } = await import('@/lib/queries/vendors')
  // When q is present, fetch all vendors so we can filter by name, cuil, cuit, AND email in memory (email is Clerk-only)
  const vendors = await listAllVendors(filters?.q ? undefined : filters?.q)

  const client = await clerkClient()
  const { data: clerkUsers } = await client.users.getUserList({ limit: 500 })
  const clerkMap = new Map(clerkUsers.map((u) => [u.id, u]))

  let items = vendors.map((v) => {
    const clerkUser = clerkMap.get(v.userId)
    const reviews = await getVendorReviewsWithStats(v.userId)
    return {
      ...v,
      clerkName: clerkUser ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || '' : '',
      clerkEmail: clerkUser?.emailAddresses?.[0]?.emailAddress || '',
      promedio: reviews.promedio,
      totalReviews: reviews.total,
    }
  })

  // Filter all fields in memory with OR logic (email from Clerk, rest from DB)
  if (filters?.q) {
    const q = filters.q.toLowerCase()
    items = items.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.cuil ?? '').toLowerCase().includes(q) ||
        (v.cuit ?? '').toLowerCase().includes(q) ||
        v.clerkEmail.toLowerCase().includes(q)
    )
  }

  // Sort in memory
  const order = filters?.sortOrder === 'desc' ? -1 : 1
  if (filters?.sortBy === 'name') {
    items.sort((a, b) => a.name.localeCompare(b.name) * order)
  } else if (filters?.sortBy === 'isActive') {
    items.sort((a, b) => (Number(a.isActive) - Number(b.isActive)) * order)
  } else {
    const dir = filters?.sortOrder === 'asc' ? 1 : -1
    items.sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * dir)
  }

  const limit = 10
  const total = items.length
  const pageCount = Math.ceil(total / limit)
  const paginatedItems = items.slice((page - 1) * limit, page * limit)

  return { items: paginatedItems, total, pageCount }
}

export async function getVendorWithClerkInfo(vendorId: string) {
  await requireAdmin()

  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, deletedAt: null },
  })
  if (!vendor) return null

  const client = await clerkClient()
  try {
    const clerkUser = await client.users.getUser(vendor.userId)
    return {
      ...vendor,
      clerkName: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || '',
      clerkEmail: clerkUser?.emailAddresses?.[0]?.emailAddress || '',
    }
  } catch {
    return { ...vendor, clerkName: '', clerkEmail: '' }
  }
}

export async function createVendorAsAdmin(data: {
  userId: string
  name: string
  address: string
  description?: string
  cuil?: string
  cuit?: string
  image?: string
}) {
  await requireAdmin()

  const input = validateVendorInput(data)
  const vendor = await prisma.vendor.create({ data: { ...input, userId: data.userId } })

  revalidatePath('/dashboard/admin/vendors')
  return vendor
}

export async function updateVendorAsAdmin(
  vendorId: string,
  data: {
    name?: string
    address?: string
    description?: string
    cuil?: string
    cuit?: string
    image?: string
  }
) {
  await requireAdmin()

  validateVendorUpdateInput(data)

  const vendor = await prisma.vendor.update({
    where: { id: vendorId },
    data,
  })

  revalidatePath('/dashboard/admin/vendors')
  return vendor
}

export async function deleteVendorAsAdmin(vendorId: string) {
  await requireAdmin()

  const vendor = await prisma.vendor.update({
    where: { id: vendorId },
    data: { deletedAt: new Date() },
  })

  revalidatePath('/dashboard/admin/vendors')
  return vendor
}

export async function toggleVendorActiveStatus(vendorId: string) {
  await requireAdmin()

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
  if (!vendor) throw new Error('Vendedor no encontrado')

  const updated = await prisma.vendor.update({
    where: { id: vendorId },
    data: { isActive: !vendor.isActive },
  })

  await revalidatePath('/dashboard/admin/vendors')
  await revalidatePath(`/dashboard/admin/vendors/${vendorId}`)
  await revalidatePath('/dashboard/overview')
  return updated
}

export async function updateOrderStatusAsAdmin(orderId: string, status: 'PAID' | 'READY') {
  await requireAdmin()

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  })

  revalidatePath('/dashboard/admin/orders')
  revalidatePath('/dashboard/admin/vendors')
  return order
}

export async function deleteOrderAsAdmin(orderId: string) {
  await requireAdmin()

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { deletedAt: new Date() },
  })

  revalidatePath('/dashboard/admin/orders')
  revalidatePath('/dashboard/admin/vendors')
  return order
}

export async function createProductAsAdmin(
  vendorId: string,
  data: {
    name: string
    description?: string
    price: number
    stock: number
    image?: string
  }
) {
  await requireAdmin()

  const input = validateProductInput(data)
  const product = await prisma.product.create({ data: { ...input, vendorId } })

  revalidatePath('/dashboard/admin/products')
  revalidatePath('/dashboard/admin/vendors')
  return product
}

export async function updateProductAsAdmin(
  vendorId: string,
  productId: string,
  data: {
    name?: string
    description?: string
    price?: number
    stock?: number
    image?: string
  }
) {
  await requireAdmin()

  const product = await prisma.product.update({
    where: { id: productId, vendorId },
    data,
  })

  revalidatePath('/dashboard/admin/products')
  revalidatePath('/dashboard/admin/vendors')
  return product
}

export async function deleteProductAsAdmin(vendorId: string, productId: string) {
  await requireAdmin()

  const product = await prisma.product.update({
    where: { id: productId, vendorId },
    data: { deletedAt: new Date() },
  })

  revalidatePath('/dashboard/admin/products')
  revalidatePath('/dashboard/admin/vendors')
  return product
}

