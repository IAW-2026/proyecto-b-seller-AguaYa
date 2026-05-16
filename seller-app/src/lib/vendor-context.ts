import { auth } from '@clerk/nextjs/server'
import { cache } from 'react'
import { getCachedVendorByUserId } from '@/lib/cache'

export type VendorContext = {
  userId: string | null
  vendor: {
    id: string
    name: string
    address: string
    reputation: number
    description?: string | null
  } | null
}

// React cache() deduplica dentro del mismo render tree.
// unstable_cache (internamente en getCachedVendorByUserId) persiste entre requests.
export const getVendorByUserId = cache(async (userId: string) => {
  return getCachedVendorByUserId(userId)
})

// Public helper: runs auth() per-request and uses the keyed cache for Prisma lookup.
export async function getVendorContext(): Promise<VendorContext> {
  const authStart = Date.now()
  const { userId } = await auth()
  const authMs = Date.now() - authStart
  console.debug(`[perf] auth: ${authMs}ms`)

  if (!userId) {
    return { userId: null, vendor: null }
  }

  const vendor = await getVendorByUserId(userId)

  return { userId, vendor }
}
