import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function getAuthRoles(): Promise<string[]> {
  const { sessionClaims } = await auth()
  const metadata = sessionClaims?.metadata as Record<string, unknown> | undefined
  return (metadata?.roles as string[]) || []
}

export async function requireAdmin() {
  const roles = await getAuthRoles()
  if (!roles.includes('admin_seller')) throw new Error('No autorizado')
}

export async function getAuthenticatedVendor() {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')
  const vendor = await prisma.vendor.findUnique({ where: { userId } })
  if (!vendor) throw new Error('No autenticado')
  return vendor
}
