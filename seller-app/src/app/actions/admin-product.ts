'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { validateProductInput } from '@/lib/validation'

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
