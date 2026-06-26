/**
 * admin-product.ts — Server actions de administración de productos.
 *
 * Permite crear, actualizar y eliminar productos de cualquier vendedor
 * desde el panel admin. Todas las funciones requieren rol admin_seller.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { validateProductInput } from '@/lib/validation'

/** Crea un producto para un vendedor específico (admin). */
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

/** Actualiza un producto de un vendedor específico (admin). */
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

/** Elimina (soft-delete) un producto de un vendedor (admin). */
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
