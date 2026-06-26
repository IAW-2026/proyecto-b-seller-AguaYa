/**
 * admin-order.ts — Server actions de administración de órdenes.
 *
 * Permite actualizar estado y eliminar órdenes desde el panel admin.
 * Todas las funciones requieren rol admin_seller.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { notifyExternalService } from '@/lib/external-api'

/** Actualiza el estado de una orden (admin). */
export async function updateOrderStatusAsAdmin(orderId: string, status: 'PAID' | 'READY') {
  await requireAdmin()

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: { items: true },
  })

  if (status === 'READY') {
    const cantBidones = order.items.reduce((sum, item) => sum + item.quantity, 0)

    console.log('[Delivery POST admin] phone:', order.phone, 'externalId:', order.externalId)

    await Promise.allSettled([
      notifyExternalService('delivery', '/api/ready-orders', 'POST', {
        pedidos: [{
          id_pedido_externo: order.externalId,
          id_vendedor: order.vendorId,
          cliente: order.buyerName || order.buyerId,
          direccion: order.address ?? '',
          telefono: order.phone ?? null,
          cant_bidones: cantBidones,
          zona: null,
        }],
      }),
      notifyExternalService('buyer', `/api/orders/${order.externalId}`, 'PATCH', { orderStatus: 'READY' as const }),
    ])
  }

  revalidatePath('/dashboard/admin/orders')
  revalidatePath('/dashboard/admin/vendors')
  return order
}

/** Elimina (soft-delete) una orden (admin). */
export async function deleteOrderAsAdmin(orderId: string) {
  await requireAdmin()

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { deletedAt: new Date() },
  })

  revalidatePath('/dashboard/admin/orders')
  revalidatePath('/dashboard/admin/vendors')
  return order
}
