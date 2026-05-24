/**
 * default-handler.js — Cache handler distribuido con Upstash Redis.
 *
 * Reemplaza el handler default en memoria para que el cache de 'use cache'
 * sea compartido entre todas las instancias serverless de Vercel.
 *
 * Env vars requeridas:
 *   CACHE_STORAGE_KV_REST_API_URL
 *   CACHE_STORAGE_KV_REST_API_TOKEN
 *
 * Estas variables las inyecta Vercel automáticamente al instalar el add-on KV Storage.
 * Para desarrollo local, agregarlas a .env con los mismos nombres.
 */

const { Redis } = require('@upstash/redis')

const kv = new Redis({
  url: process.env.CACHE_STORAGE_KV_REST_API_URL,
  token: process.env.CACHE_STORAGE_KV_REST_API_TOKEN,
})

// Cache local de timestamps de tags para getExpiration()
// Se refresca via refreshTags() antes de cada request
let localTagTimestamps = null

module.exports = {
  /**
   * Recupera una entrada de cache desde Upstash.
   * Si no existe o expiró según revalidate, retorna undefined (cache miss).
   */
  async get(cacheKey, softTags) {
    try {
      const stored = await kv.get(cacheKey)
      if (stored == null) {
        console.log(`[cache] MISS ${cacheKey}`)
        return undefined
      }

      const data = typeof stored === 'string' ? JSON.parse(stored) : stored
      console.log(`[cache] HIT  ${cacheKey} (tags: ${(data.tags || []).join(',') || 'none'})`)

      // Reconstruir el ReadableStream desde el buffer base64
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

  /**
   * Almacena una entrada en Upstash con TTL = expire.
   * Lee el ReadableStream, lo serializa a base64, y lo guarda como JSON.
   */
  async set(cacheKey, pendingEntry) {
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

      // Usar entry.expire como TTL de Redis (segundos)
      await kv.setex(
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
      console.error('[cache-handler] Error en set():', err)
    }
  },

  /**
   * Sincroniza los timestamps de invalidación de tags desde Upstash.
   * Se llama antes de cada request para coordinar revalidateTag() entre instancias.
   */
  async refreshTags() {
    try {
      const tagKeys = await kv.smembers('revalidated-tags')
      if (!tagKeys || tagKeys.length === 0) return

      const entries = await Promise.all(
        tagKeys.map(async (tag) => {
          const ts = await kv.get(`tag:${tag}`)
          return [tag, ts ? Number(ts) : 0]
        }),
      )

      localTagTimestamps = new Map(entries)
    } catch (err) {
      console.error('[cache-handler] Error en refreshTags():', err)
      localTagTimestamps = new Map()
    }
  },

  /**
   * Retorna el timestamp de revalidación más reciente entre los tags dados.
   * 0 = ningún tag fue revalidado nunca.
   */
  async getExpiration(tags) {
    if (!localTagTimestamps || tags.length === 0) return 0
    const timestamps = tags.map((tag) => localTagTimestamps.get(tag) || 0)
    return Math.max(...timestamps, 0)
  },

  /**
   * Marca tags como invalidados con el timestamp actual.
   * Se llama cuando se ejecuta revalidateTag() en una server action.
   */
  async updateTags(tags, durations) {
    try {
      const now = Date.now()
      console.log(`[cache] TAG invalidate ${tags.join(', ')}`)

      if (!localTagTimestamps) localTagTimestamps = new Map()

      if (tags.length > 0) {
        await kv.sadd('revalidated-tags', ...tags)
        await Promise.all(
          tags.map((tag) => {
            localTagTimestamps.set(tag, now)
            return kv.set(`tag:${tag}`, String(now))
          }),
        )
      }
    } catch (err) {
      console.error('[cache-handler] Error en updateTags():', err)
    }
  },
}
