import { auth } from '@clerk/nextjs/server'

export async function getAuthRoles(): Promise<string[]> {
  const { sessionClaims } = await auth()
  return (sessionClaims?.public_metadata?.roles as string[]) || []
}
