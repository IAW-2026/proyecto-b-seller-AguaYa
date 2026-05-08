/**
 * This file contains server actions related to vendor management. It includes a function to create or update the vendor profile for the authenticated user. The function checks if the user is authenticated and then uses Prisma to either create a new vendor record or update the existing one based on the user's ID.
 */


'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { validateVendorInput } from '../../lib/validation'

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

  const input = validateVendorInput(data)

  try {
    const vendor = await prisma.vendor.upsert({
      where: { userId },
      create: {
        userId,
        name: input.name,
        address: input.address,
        description: input.description,
        cuil: input.cuil,
        cuit: input.cuit,
      },
      update: {
        name: input.name,
        address: input.address,
        description: input.description,
        cuil: input.cuil,
        cuit: input.cuit,
      },
    })

    return { success: true, vendor }
  } catch (error) {
    console.error('Error al guardar vendedor:', error)
    throw new Error('Error al guardar los datos del vendedor')
  }
}
