/**
 * product.ts — Server actions de gestión de productos del vendedor.
 *
 * Permite crear, actualizar, eliminar (soft-delete), toggle de activo
 * y actualizar stock de productos. Las funciones verifican que el
 * producto pertenezca al vendedor autenticado.
 */

'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { validateProductInput } from '../../lib/validation'
import { getAuthRoles, getAuthenticatedVendor } from '@/lib/auth-utils'

/** Crea un nuevo producto para el vendedor autenticado. */
export async function createProduct(data: {
  name: string
  description?: string
  price: number
  stock: number
  image?: string
}) {
  const vendor = await getAuthenticatedVendor()
  const input = validateProductInput(data)

  const product = await prisma.product.create({
    data: {
      vendorId: vendor.id,
      name: input.name,
      description: input.description,
      price: input.price,
      stock: input.stock,
      image: input.image,
    },
  })

  revalidatePath('/dashboard/vendor/products')
  revalidatePath('/dashboard/overview')

  return { success: true, product }
}

/**
 * Actualiza un producto. Si se pasa vendorId (admin), verifica rol admin_seller.
 * Si no, verifica que el producto pertenezca al vendedor autenticado.
 */
export async function updateProduct(data: {
  id: string
  name: string
  description?: string
  price: number
  stock: number
  image?: string
  vendorId?: string
}) {
  const input = validateProductInput(data)

  if (data.vendorId) {
    const roles = await getAuthRoles()
    if (!roles.includes('admin_seller')) throw new Error('No autorizado')

    const updatedProduct = await prisma.product.update({
      where: { id: data.id },
      data: {
        name: input.name,
        description: input.description,
        price: input.price,
        stock: input.stock,
        image: input.image,
      },
    })

    revalidatePath(`/dashboard/admin/vendors/${data.vendorId}`)
    revalidatePath('/dashboard/admin/products')
    revalidatePath('/dashboard/admin/vendors')
    return { success: true, product: updatedProduct }
  }

  const vendor = await getAuthenticatedVendor()

  const product = await prisma.product.findFirst({
    where: {
      id: data.id,
      vendorId: vendor.id,
      deletedAt: null,
    },
  })

  if (!product) {
    throw new Error('No se encontró el producto para este vendedor')
  }

  const updatedProduct = await prisma.product.update({
    where: { id: data.id },
    data: {
      name: input.name,
      description: input.description,
      price: input.price,
      stock: input.stock,
      image: input.image,
    },
  })

  revalidatePath('/dashboard/vendor/products')
  revalidatePath('/dashboard/overview')

  return { success: true, product: updatedProduct }
}

/**
 * Elimina (soft-delete) un producto. Si se pasa vendorId (admin), verifica
 * rol admin_seller. Si no, verifica que el producto pertenezca al vendedor.
 */
export async function deleteProduct(productId: string, vendorId?: string) {
  if (vendorId) {
    const roles = await getAuthRoles()
    if (!roles.includes('admin_seller')) throw new Error('No autorizado')

    const deletedProduct = await prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date() },
    })

    revalidatePath(`/dashboard/admin/vendors/${vendorId}`)
    revalidatePath('/dashboard/admin/products')
    revalidatePath('/dashboard/admin/vendors')
    return { success: true, product: deletedProduct }
  }

  const vendor = await getAuthenticatedVendor()

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      vendorId: vendor.id,
      deletedAt: null,
    },
  })

  if (!product) {
    throw new Error('No se encontró el producto para este vendedor')
  }

  const deletedProduct = await prisma.product.update({
    where: { id: productId },
    data: {
      deletedAt: new Date(),
    },
  })

  revalidatePath('/dashboard/vendor/products')
  revalidatePath('/dashboard/overview')

  return { success: true, product: deletedProduct }
}

/** Actualiza el stock de un producto (valida entero >= 0). */
export async function updateProductStock(productId: string, stock: number) {
  const vendor = await getAuthenticatedVendor()

  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error('El stock debe ser un número entero mayor o igual a cero')
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      vendorId: vendor.id,
      deletedAt: null,
    },
  })

  if (!product) {
    throw new Error('No se encontró el producto para este vendedor')
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { stock },
  })

  revalidatePath('/dashboard/vendor/products')
  revalidatePath('/dashboard/overview')

  return { success: true, product: updated }
}

/** Alterna el estado activo/inactivo de un producto. */
export async function toggleProductActiveStatus(productId: string) {
  const vendor = await getAuthenticatedVendor()

  const product = await prisma.product.findFirst({
    where: { id: productId, vendorId: vendor.id, deletedAt: null },
  })
  if (!product) throw new Error('No se encontró el producto para este vendedor')

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { isActive: !product.isActive },
  })

  await revalidatePath('/dashboard/vendor/products')
  await revalidatePath('/dashboard/overview')
  await revalidatePath('/dashboard/admin/products')
  await revalidatePath(`/dashboard/admin/vendors/${vendor.id}`)

  return updated
}
