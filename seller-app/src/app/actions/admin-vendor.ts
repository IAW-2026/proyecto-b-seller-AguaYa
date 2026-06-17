/**
 * admin-vendor.ts — Server actions de administración de vendedores.
 *
 * Permite listar, crear, actualizar y eliminar vendedores desde el panel admin.
 * Integra datos de Clerk (nombre, email) y reseñas desde FeedbackApp.
 * Todas las funciones requieren rol admin_seller.
 */

'use server'

import { clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { validateVendorUpdateInput } from '@/lib/validation'
import { ADMIN_PAGE_SIZE, CLERK_USERS_FETCH_LIMIT } from '@/lib/constants'
import { getVendorReviewsWithStats } from '@/lib/queries/reviews'

/** Retorna todos los vendedores con datos de Clerk (sin paginación). */
export async function getVendorsWithClerkInfo() {
  await requireAdmin()

  const vendors = await prisma.vendor.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  const client = await clerkClient()
  const { data: clerkUsers } = await client.users.getUserList({ limit: CLERK_USERS_FETCH_LIMIT })
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

/**
 * Retorna vendedores paginados con datos de Clerk y reseñas.
 * Soporta búsqueda y ordenamiento. Sin query, usa paginación
 * batch de Clerk. Con query, filtra en memoria todo Clerk.
 */
export async function getVendorsWithClerkInfoPaginated(
  page: number = 1,
  filters?: { q?: string; sortBy?: string; sortOrder?: string }
) {
  await requireAdmin()

  const { listAllVendors, listAllVendorsPaginated } = await import('@/lib/queries/vendors')
  const client = await clerkClient()

  const limit = ADMIN_PAGE_SIZE

  if (!filters?.q) {
    const dbResult = await listAllVendorsPaginated(page, {
      limit,
      sortBy: filters?.sortBy,
      sortOrder: filters?.sortOrder,
    })

    const userIds = dbResult.items.map((v) => v.userId)
    const { data: clerkUsers } = await client.users.getUserList({
      userId: userIds,
      limit: userIds.length,
    })
    const clerkMap = new Map(clerkUsers.map((u) => [u.id, u]))

    const items = await Promise.all(dbResult.items.map(async (v) => {
      const clerkUser = clerkMap.get(v.userId)
      const clerkName = clerkUser ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || '' : ''
      const clerkEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || ''

      const reviews = await getVendorReviewsWithStats(v.userId)
      return {
        ...v,
        clerkName,
        clerkEmail,
        promedio: reviews.promedio,
        totalReviews: reviews.total,
      }
    }))

    return { items, total: dbResult.total, pageCount: dbResult.pageCount }
  }

  const vendors = await listAllVendors()

  const { data: clerkUsers } = await client.users.getUserList({ limit: CLERK_USERS_FETCH_LIMIT })
  const clerkMap = new Map(clerkUsers.map((u) => [u.id, u]))

  let items = vendors.map((v) => {
    const clerkUser = clerkMap.get(v.userId)
    return {
      ...v,
      clerkName: clerkUser ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || '' : '',
      clerkEmail: clerkUser?.emailAddresses?.[0]?.emailAddress || '',
      promedio: 0,
      totalReviews: 0,
    }
  })

  const q = filters.q.toLowerCase()
  items = items.filter(
    (v) =>
      v.name.toLowerCase().includes(q) ||
      (v.cuil ?? '').toLowerCase().includes(q) ||
      (v.cuit ?? '').toLowerCase().includes(q) ||
      v.clerkEmail.toLowerCase().includes(q)
  )

  const order = filters?.sortOrder === 'desc' ? -1 : 1
  if (filters?.sortBy === 'name') {
    items.sort((a, b) => a.name.localeCompare(b.name) * order)
  } else if (filters?.sortBy === 'isActive') {
    items.sort((a, b) => (Number(a.isActive) - Number(b.isActive)) * order)
  } else {
    const dir = filters?.sortOrder === 'asc' ? 1 : -1
    items.sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * dir)
  }

  const total = items.length
  const pageCount = Math.ceil(total / limit)
  const paginatedItems = items.slice((page - 1) * limit, page * limit)

  const itemsWithReviews = await Promise.all(paginatedItems.map(async (v) => {
    const reviews = await getVendorReviewsWithStats(v.userId)
    return { ...v, promedio: reviews.promedio, totalReviews: reviews.total }
  }))

  return { items: itemsWithReviews, total, pageCount }
}

/** Retorna un vendedor individual con datos de Clerk. */
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

/** Actualiza un vendedor (admin). */
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

/** Elimina (soft-delete) un vendedor (admin). */
export async function deleteVendorAsAdmin(vendorId: string) {
  await requireAdmin()

  const vendor = await prisma.vendor.update({
    where: { id: vendorId },
    data: { deletedAt: new Date() },
  })

  revalidatePath('/dashboard/admin/vendors')
  return vendor
}

/** Alterna el estado activo/inactivo de un vendedor (admin). */
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
