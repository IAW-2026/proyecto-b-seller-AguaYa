'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function createOrUpdateVendor(data: {
  name: string
  address: string
  description?: string
  cuil?: string
  cuit?: string
}) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('No autenticado')
  }

  try {
    const vendor = await prisma.vendor.upsert({
      where: { userId },
      create: {
        userId,
        name: data.name,
        address: data.address,
        description: data.description,
        cuil: data.cuil,
        cuit: data.cuit,
      },
      update: {
        name: data.name,
        address: data.address,
        description: data.description,
        cuil: data.cuil,
        cuit: data.cuit,
      },
    })

    return { success: true, vendor }
  } catch (error) {
    console.error('Error al guardar vendedor:', error)
    throw new Error('Error al guardar los datos del vendedor')
  }
}
