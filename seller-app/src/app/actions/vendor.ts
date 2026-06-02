/**
 * vendor.ts — Server actions de perfil del vendedor.
 *
 * Permite crear/actualizar el perfil del vendedor autenticado
 * y toggle de estado activo. Al crear, asigna el rol 'seller'
 * en Clerk.
 */

'use server'

import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { validateVendorInput } from '@/lib/validation'

/**
 * Crea o actualiza el perfil del vendedor autenticado.
 * Si ya existe un vendor para el userId, lo actualiza.
 * Si no, lo crea y asigna el rol 'seller' en Clerk.
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

  const existing = await prisma.vendor.findUnique({ where: { userId } })

  if (existing) {
    const vendor = await prisma.vendor.update({
      where: { userId },
      data: {
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

  const vendor = await prisma.vendor.create({
    data: {
      userId,
      name: input.name,
      address: input.address,
      description: input.description,
      cuil: input.cuil,
      cuit: input.cuit,
      image: input.image,
    },
  })

  const client = await clerkClient()
  await client.users.updateUser(userId, {
    publicMetadata: { roles: ['seller'] },
  })

  revalidatePath('/dashboard/overview')
  revalidatePath('/dashboard/products')

  return vendor
}

/** Alterna el estado activo/inactivo del vendedor autenticado. */
export async function toggleMyVendorActiveStatus() {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')

  const vendor = await prisma.vendor.findUnique({ where: { userId } })
  if (!vendor) throw new Error('Vendedor no encontrado')

  const updated = await prisma.vendor.update({
    where: { userId },
    data: { isActive: !vendor.isActive },
  })

  await revalidatePath('/dashboard/overview')
  await revalidatePath('/dashboard/products')
  await revalidatePath('/dashboard/settings')
  await revalidatePath('/dashboard/admin/vendors')
  await revalidatePath(`/dashboard/admin/vendors/${vendor.id}`)
  return updated
}
