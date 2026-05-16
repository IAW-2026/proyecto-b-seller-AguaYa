import { unstable_cache, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { measure } from '@/lib/perf'
import { startOutboxProcessor } from '@/lib/outbox'

// ──────────────────────────────────────────────
// Inactivity-based cache cleanup
// ──────────────────────────────────────────────
//
// Registra la última vez que se accedió a cada tag.
// Periódicamente, los tags sin acceso reciente se limpian vía revalidateTag().
// Esto evita que la cache acumule entradas de usuarios inactivos.
//
const CACHE_TAGS = ['vendor', 'orders', 'products', 'overview'] as const
type CacheTag = (typeof CACHE_TAGS)[number]

const ACCESS_TIMEOUT_MS = 30 * 60 * 1000 // 30 min sin acceso → se limpia
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000 // cada 10 min

const lastAccess = new Map<CacheTag, number>()

function markAccessed(tag: CacheTag) {
  lastAccess.set(tag, Date.now())
}

function cleanupInactiveTags() {
  const now = Date.now()
  for (const tag of CACHE_TAGS) {
    const accessed = lastAccess.get(tag)
    if (accessed !== undefined && now - accessed > ACCESS_TIMEOUT_MS) {
      console.debug(`[cache] cleanup: revalidating tag "${tag}" (inactive >30min)`)
      revalidateTag(tag, 'max')
      lastAccess.delete(tag)
    }
  }
}

// El cleanup corre en el servidor en producción y desarrollo, no durante el build.
const isBuildTime = process.env.NODE_ENV === 'production' && process.argv.some(a => a.includes('build'))
if (typeof setInterval !== 'undefined' && !isBuildTime) {
  setInterval(cleanupInactiveTags, CLEANUP_INTERVAL_MS)
  startOutboxProcessor()
}

// ──────────────────────────────────────────────
// Cached queries
// ──────────────────────────────────────────────

export const getCachedVendorByUserId = unstable_cache(
  async (userId: string) => {
    markAccessed('vendor')
    return measure(`prisma.vendor.findUnique userId=${userId}`, async () =>
      prisma.vendor.findUnique({
        where: { userId },
        select: {
          id: true,
          name: true,
          address: true,
          reputation: true,
          description: true,
        },
      })
    )
  },
  ['vendor-by-user'],
  { revalidate: 60, tags: ['vendor'] }
)

export const getCachedOverview = unstable_cache(
  async (vendorId: string) => {
    markAccessed('overview')
    return measure(`prisma.vendor.findUnique overview vendorId=${vendorId}`, async () =>
      prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
          products: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      })
    )
  },
  ['vendor-overview'],
  { revalidate: 15, tags: ['overview'] }
)

export const getCachedVendorProducts = unstable_cache(
  async (vendorId: string) => {
    markAccessed('products')
    return measure(`prisma.vendor.findUnique products vendorId=${vendorId}`, async () =>
      prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          products: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    )
  },
  ['vendor-products'],
  { revalidate: 10, tags: ['products'] }
)

export const getCachedVendorOrders = unstable_cache(
  async (vendorId: string) => {
    markAccessed('orders')
    return measure(`prisma.order.findMany vendorId=${vendorId}`, async () =>
      prisma.order.findMany({
        where: { vendorId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    )
  },
  ['vendor-orders'],
  { revalidate: 10, tags: ['orders'] }
)

export const getCachedProductById = unstable_cache(
  async (productId: string, vendorId: string) => {
    markAccessed('products')
    return measure(`prisma.product.findFirst id=${productId}`, async () =>
      prisma.product.findFirst({
        where: {
          id: productId,
          vendorId,
          deletedAt: null,
        },
      })
    )
  },
  ['product-by-id'],
  { revalidate: 10, tags: ['products'] }
)
