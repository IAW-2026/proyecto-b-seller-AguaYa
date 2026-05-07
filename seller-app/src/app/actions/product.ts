'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

async function getAuthenticatedVendor() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('No autenticado')
  }

  const vendor = await prisma.vendor.findUnique({ where: { userId } })

  if (!vendor) {
    throw new Error('No existe un vendedor asociado a esta cuenta')
  }

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

  const product = await prisma.product.create({
    data: {
      vendorId: vendor.id,
      name: data.name,
      description: data.description,
      price: data.price,
      stock: data.stock,
      image: data.image,
    },
  })

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

  const product = await prisma.product.findFirst({
    where: {
      id: data.id,
      vendorId: vendor.id,
    },
  })

  if (!product) {
    throw new Error('No se encontró el producto para este vendedor')
  }

  const updatedProduct = await prisma.product.update({
    where: { id: data.id },
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      stock: data.stock,
      image: data.image,
    },
  })

  return { success: true, product: updatedProduct }
}

export async function deleteProduct(productId: string) {
  const vendor = await getAuthenticatedVendor()

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      vendorId: vendor.id,
    },
    include: {
      _count: {
        select: {
          orderItems: true,
        },
      },
    },
  })

  if (!product) {
    throw new Error('No se encontró el producto para este vendedor')
  }

  if (product._count.orderItems > 0) {
    throw new Error('No puedes eliminar este producto porque ya está asociado a órdenes')
  }

  await prisma.product.delete({ where: { id: productId } })

  return { success: true }
}
