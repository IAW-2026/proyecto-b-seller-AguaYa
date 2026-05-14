/**
 * This file contains server actions related to order management.
 * It includes functions to fetch orders for the authenticated vendor.
 */

'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { OrderStatus } from '@prisma/client'

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

const ORDER_REVALIDATE_PATHS = ['/dashboard/orders', '/dashboard/overview']

const allowedStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'READY', 'CANCELLED'],
  CONFIRMED: ['READY', 'CANCELLED'],
  READY: ['IN_DELIVERY', 'CANCELLED'],
  IN_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
}

function assertValidStatusTransition(currentStatus: OrderStatus, nextStatus: OrderStatus) {
  if (currentStatus === nextStatus) {
    return
  }

  const validNextStatuses = allowedStatusTransitions[currentStatus] ?? []

  if (!validNextStatuses.includes(nextStatus)) {
    throw new Error(`No se puede cambiar una orden ${currentStatus} a ${nextStatus}`)
  }
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

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
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

  assertValidStatusTransition(order.status, status)

  if (order.status === status) {
    return prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  ORDER_REVALIDATE_PATHS.forEach((path) => revalidatePath(path))

  return updatedOrder
}

export async function confirmOrderForDelivery(orderId: string) {
  return updateOrderStatus(orderId, 'READY')
}
