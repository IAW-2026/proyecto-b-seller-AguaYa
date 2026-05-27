'use server'

import { clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAuthRoles } from '@/lib/auth-utils'

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

export async function getVendorsWithClerkInfoPaginated(page: number = 1) {
  await requireAdmin()

  const { listAllVendorsPaginated } = await import('@/lib/queries')
  const result = await listAllVendorsPaginated(page)

  const client = await clerkClient()
  const { data: clerkUsers } = await client.users.getUserList({ limit: 500 })
  const clerkMap = new Map(clerkUsers.map((u) => [u.id, u]))

  const items = result.items.map((v) => {
    const clerkUser = clerkMap.get(v.userId)
    return {
      ...v,
      clerkName: clerkUser ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || '' : '',
      clerkEmail: clerkUser?.emailAddresses?.[0]?.emailAddress || '',
    }
  })

  return { items, total: result.total, pageCount: result.pageCount }
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

  const vendor = await prisma.vendor.create({ data })

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

  const product = await prisma.product.create({ data: { ...data, vendorId } })

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
