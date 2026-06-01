/**
 * This file contains server actions related to product management. 
 * It includes functions to create, update, and delete products for the authenticated vendor. 
 * Each function first checks if the user is authenticated and has an associated vendor profile before performing the respective database operations using Prisma.
 */


'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { validateProductInput } from '../../lib/validation'
import { getAuthRoles, getAuthenticatedVendor } from '@/lib/auth-utils'

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

  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard/overview')

  return { success: true, product }
}

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

  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard/overview')

  return { success: true, product: updatedProduct }
}

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

  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard/overview')

  return { success: true, product: deletedProduct }
}

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

  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard/overview')

  return { success: true, product: updated }
}

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

  await revalidatePath('/dashboard/products')
  await revalidatePath('/dashboard/overview')
  await revalidatePath('/dashboard/admin/products')
  await revalidatePath(`/dashboard/admin/vendors/${vendor.id}`)

  return updated
}
