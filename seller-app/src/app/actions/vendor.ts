/**
 * vendor.ts — Server actions para gestión del perfil del vendedor.
 *
 * Funciones:
 *   createOrUpdateVendor() → Crea o actualiza el perfil del vendedor autenticado
 */

'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { validateVendorInput } from '@/lib/validation'

/**
 * Crea o actualiza el perfil del vendedor para el usuario autenticado.
 * Usa upsert keyeado por userId (único).
 */
export async function createOrUpdateVendor(data: {
  name: string
  address: string
  description?: string
  cuil?: string
  cuit?: string
  image?: string
}) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('No autenticado')
  }

  const input = validateVendorInput(data)

  const vendor = await prisma.vendor.upsert({
    where: { userId },
    update: {
      name: input.name,
      address: input.address,
      description: input.description,
      cuil: input.cuil,
      cuit: input.cuit,
      image: input.image,
    },
    create: {
      userId,
      name: input.name,
      address: input.address,
      description: input.description,
      cuil: input.cuil,
      cuit: input.cuit,
      image: input.image,
    },
  })

  revalidatePath('/dashboard/overview')
  revalidatePath('/dashboard/products')

  return vendor
}

export async function toggleMyVendorActiveStatus() {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')

  const vendor = await prisma.vendor.findUnique({ where: { userId } })
  if (!vendor) throw new Error('Vendedor no encontrado')

  const updated = await prisma.vendor.update({
    where: { userId },
    data: { isActive: !vendor.isActive },
  })

  revalidatePath('/dashboard/overview')
  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard/settings')
  return updated
}
