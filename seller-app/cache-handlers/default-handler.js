/**
 * default-handler.js — Cache handler distribuido con Upstash Redis.
 *
 * Reemplaza el handler default en memoria para que el cache de 'use cache'
 * sea compartido entre todas las instancias serverless de Vercel.
 *
 * Env vars requeridas (inyectadas por Vercel al instalar KV Storage):
 *   CACHE_STORAGE_KV_REST_API_URL
 *   CACHE_STORAGE_KV_REST_API_TOKEN
 *
 * Para desarrollo local, agregarlas a .env con los mismos nombres.
 */

const { Redis } = require('@upstash/redis')

let kv = null

function getRedis() {
  if (kv) return kv

  const url = process.env.CACHE_STORAGE_KV_REST_API_URL
  const token = process.env.CACHE_STORAGE_KV_REST_API_TOKEN

  if (!url || !token) {
    console.log('[cache] Redis no configurado — usar handler default en memoria')
    return null
  }

  kv = new Redis({ url, token })
  console.log('[cache] Redis conectado a', url.replace(/\/\/.*@/, '//***@'))
  return kv
}

// Cache local de timestamps de tags para getExpiration()
let localTagTimestamps = null

module.exports = {
  async get(cacheKey, softTags) {
    const redis = getRedis()
    if (!redis) return undefined

    try {
      const stored = await redis.get(cacheKey)
      if (stored == null) {
        console.log(`[cache] MISS ${cacheKey}`)
        return undefined
      }

      const data = typeof stored === 'string' ? JSON.parse(stored) : stored
      console.log(`[cache] HIT  ${cacheKey} (tags: ${(data.tags || []).join(',') || 'none'})`)

      const buffer = Buffer.from(data.value, 'base64')

      return {
        value: new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(buffer))
            controller.close()
          },
        }),
        tags: data.tags,
        stale: data.stale,
        timestamp: data.timestamp,
        expire: data.expire,
        revalidate: data.revalidate,
      }
    } catch (err) {
      console.error('[cache] Error en get():', err)
      return undefined
    }
  },

  async set(cacheKey, pendingEntry) {
    const redis = getRedis()
    if (!redis) return

    try {
      const entry = await pendingEntry
      console.log(`[cache] SET  ${cacheKey} (ttl: ${entry.expire}s, tags: ${(entry.tags || []).join(',') || 'none'})`)

      const reader = entry.value.getReader()
      const chunks = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }

      const raw = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('base64')

      await redis.setex(
        cacheKey,
        entry.expire || 86400,
        JSON.stringify({
          value: raw,
          tags: entry.tags,
          stale: entry.stale,
          timestamp: entry.timestamp,
          expire: entry.expire,
          revalidate: entry.revalidate,
        }),
      )
    } catch (err) {
      console.error('[cache] Error en set():', err)
    }
  },

  async refreshTags() {
    const redis = getRedis()
    if (!redis) return

    try {
      const tagKeys = await redis.smembers('revalidated-tags')
      if (!tagKeys || tagKeys.length === 0) return

      const entries = await Promise.all(
        tagKeys.map(async (tag) => {
          const ts = await redis.get(`tag:${tag}`)
          return [tag, ts ? Number(ts) : 0]
        }),
      )

      localTagTimestamps = new Map(entries)
      console.log(`[cache] refreshTags: ${tagKeys.length} tags sincronizados`)
    } catch (err) {
      console.error('[cache] Error en refreshTags():', err)
      localTagTimestamps = new Map()
    }
  },

  async getExpiration(tags) {
    if (!localTagTimestamps || tags.length === 0) return 0
    const timestamps = tags.map((tag) => localTagTimestamps.get(tag) || 0)
    return Math.max(...timestamps, 0)
  },

  async updateTags(tags, durations) {
    const redis = getRedis()
    if (!redis) return

    try {
      const now = Date.now()
      console.log(`[cache] TAG invalidate ${tags.join(', ')}`)

      if (!localTagTimestamps) localTagTimestamps = new Map()

      if (tags.length > 0) {
        await redis.sadd('revalidated-tags', ...tags)
        await Promise.all(
          tags.map((tag) => {
            localTagTimestamps.set(tag, now)
            return redis.set(`tag:${tag}`, String(now))
          }),
        )
      }
    } catch (err) {
      console.error('[cache] Error en updateTags():', err)
    }
  },
}
