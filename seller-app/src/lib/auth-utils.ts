import { auth, clerkClient } from '@clerk/nextjs/server'

export async function getAuthRoles(): Promise<string[]> {
  const { userId } = await auth()
  if (!userId) return []

  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    return (user.publicMetadata.roles as string[]) || []
  } catch {
    return []
  }
}
