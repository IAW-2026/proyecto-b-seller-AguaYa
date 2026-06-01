import { auth } from '@clerk/nextjs/server'

export async function getAuthRoles(): Promise<string[]> {
  const { sessionClaims } = await auth()
  const metadata = sessionClaims?.metadata as Record<string, unknown> | undefined
  return (metadata?.roles as string[]) || []
}
