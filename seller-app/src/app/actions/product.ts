/**
 * This file contains server actions related to product management. 
 * It includes functions to create, update, and delete products for the authenticated vendor. 
 * Each function first checks if the user is authenticated and has an associated vendor profile before performing the respective database operations using Prisma.
 */


'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { validateProductInput } from '../../lib/validation'

async function getAuthenticatedVendor() {
  const { userId } = await auth()

  if (!userId) throw new Error('No autenticado')

  const vendor = await prisma.vendor.findUnique({ where: { userId } })

  if (!vendor) throw new Error('No autenticado')

  return vendor
}

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
}) {
  const vendor = await getAuthenticatedVendor()
  const input = validateProductInput(data)

  const product = await prisma.product.findFirst({
    where: {
      id: data.id,
      vendorId: vendor.id,
      deletedAt: null, // Solo permite editar productos no eliminados
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

export async function deleteProduct(productId: string) {
  const vendor = await getAuthenticatedVendor()

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      vendorId: vendor.id,
      deletedAt: null, // Solo permite eliminar productos no ya eliminados
    },
  })

  if (!product) {
    throw new Error('No se encontró el producto para este vendedor')
  }

  // Soft delete: marcar como eliminado en lugar de borrar de BD
  // Esto preserva el histórico completo de órdenes asociadas
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
