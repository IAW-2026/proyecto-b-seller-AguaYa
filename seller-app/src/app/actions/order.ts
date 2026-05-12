/**
 * This file contains server actions related to order management.
 * It includes functions to fetch orders for the authenticated vendor.
 */

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

export async function getVendorOrders() {
  const vendor = await getAuthenticatedVendor()

  const orders = await prisma.order.findMany({
    where: { vendorId: vendor.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return orders
}

export async function updateOrderStatus(orderId: string, status: string) {
  const vendor = await getAuthenticatedVendor()

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      vendorId: vendor.id,
    },
  })

  if (!order) {
    throw new Error('No se encontró la orden para este vendedor')
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: status as any,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  return updatedOrder
}
