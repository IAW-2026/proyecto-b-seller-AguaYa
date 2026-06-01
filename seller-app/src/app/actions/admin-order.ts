'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'

export async function updateOrderStatusAsAdmin(orderId: string, status: 'PAID' | 'READY') {
  await requireAdmin()

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  })

  revalidatePath('/dashboard/admin/orders')
  revalidatePath('/dashboard/admin/vendors')
  return order
}

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
