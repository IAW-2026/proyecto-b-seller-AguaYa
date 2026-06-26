/**
 * auth-utils.ts — Utilidades de autenticación con Clerk.
 *
 * Proporciona funciones para obtener roles JWT, verificar permisos de admin
 * y obtener el vendedor autenticado desde la base de datos.
 */
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/** Obtiene los roles del usuario desde los claims del JWT de Clerk. */
export async function getAuthRoles(): Promise<string[]> {
  const { sessionClaims } = await auth()
  const metadata = sessionClaims?.metadata as Record<string, unknown> | undefined
  return (metadata?.roles as string[]) || []
}

/** Verifica que el usuario tenga rol admin_seller; si no, lanza error. */
export async function requireAdmin() {
  const roles = await getAuthRoles()
  if (!roles.includes('admin_seller')) throw new Error('No autorizado')
}

/**
 * Obtiene el vendedor asociado al usuario autenticado.
 * Lanza error si no hay sesión o si el usuario no tiene vendor registrado.
 */
export async function getAuthenticatedVendor() {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')
  const vendor = await prisma.vendor.findUnique({ where: { userId } })
  if (!vendor) throw new Error('No autenticado')
  return vendor
}
