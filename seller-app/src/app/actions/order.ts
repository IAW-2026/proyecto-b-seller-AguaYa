/**
 * order.ts — Server actions de gestión de órdenes del vendedor.
 *
 * Funciones:
 *   getVendorOrders()          → Retorna todas las órdenes del vendedor autenticado
 *   updateOrderStatus()        → Cambia el estado de una orden (con validación de transición)
 *   confirmOrderForDelivery()  → Marca como READY + notifica a DeliveryApp y BuyerApp
 *
 * Las notificaciones externas son fire-and-forget: si el servicio destino está caído,
 * el error solo se loguea y no bloquea la confirmación local.
 */

'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getVendorOrders as getCachedVendorOrders, getVendorOrdersByDateRange } from '@/lib/queries/orders'
import { notifyExternalService } from '@/lib/external-api'
import { OrderStatus } from '@prisma/client'
import { getAuthenticatedVendor } from '@/lib/auth-utils'

const allowedStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  PAID: ['READY'],
  READY: [],
}

function assertValidStatusTransition(currentStatus: OrderStatus, nextStatus: OrderStatus) {
  const validNextStatuses = allowedStatusTransitions[currentStatus] ?? []

  if (!validNextStatuses.includes(nextStatus)) {
    throw new Error(`No se puede cambiar una orden ${currentStatus} a ${nextStatus}`)
  }
}

export async function getVendorOrders() {
  const vendor = await getAuthenticatedVendor()
  return getCachedVendorOrders(vendor.id)
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

  revalidatePath('/dashboard/vendor/orders')
  revalidatePath('/dashboard/overview')

  return updatedOrder
}

/**
 * Marca una orden como READY (lista para entregar) y notifica a los servicios externos.
 *
 * Flujo:
 *   1. Actualiza el estado de la orden local a READY
 *   2. Notifica a DeliveryApp (PUT /api/ready_orders/:id)
 *   3. Notifica a BuyerApp (PATCH /api/orders/:id) con { orderStatus: "READY" }
 *
 * Las notificaciones son fire-and-forget: un error externo no bloquea la confirmación local.
 */
export async function confirmOrderForDelivery(orderId: string) {
  const vendor = await getAuthenticatedVendor()

  // 1. Actualizar estado local
  const updatedOrder = await updateOrderStatus(orderId, 'READY')

  // 2. Notificar servicios externos (no bloqueante)
  const cantBidones = updatedOrder.items.reduce((sum, item) => sum + item.quantity, 0)

  await Promise.allSettled([
    notifyExternalService('delivery', '/api/ready-orders', 'POST', {
      pedidos: [{
        id_pedido_externo: updatedOrder.externalId,
        id_vendedor: vendor.id,
        cliente: updatedOrder.buyerName,
        direccion: updatedOrder.address ?? '',
        telefono: '',
        cant_bidones: cantBidones,
        zona: '',
      }],
    }),
    notifyExternalService('buyer', `/api/orders/${orderId}`, 'PATCH', { orderStatus: 'READY' as const }),
  ])

  return updatedOrder
}

export async function getOrderChartData(vendorId: string, from: string, to: string) {
  const vendor = await getAuthenticatedVendor()
  if (vendor.id !== vendorId) throw new Error('No autorizado')

  return getVendorOrdersByDateRange(vendorId, from, to)
}
