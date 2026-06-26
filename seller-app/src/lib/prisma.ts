/**
 * prisma.ts — Singleton del cliente de Prisma con adaptador Neon (PostgreSQL serverless).
 *
 * Configura la conexión a la base de datos usando DATABASE_URL del entorno,
 * con soporte para Neon serverless mediante PrismaNeon adapter.
 * En desarrollo, mantiene una única instancia reutilizada en hot-reload.
 * Opcionalmente, habilita logging de queries con DEBUG_PRISMA_QUERIES=true.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import type { PoolConfig } from '@neondatabase/serverless'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    throw new Error('DATABASE_URL no está definida')
}

const adapter = new PrismaNeon({ connectionString } satisfies PoolConfig)

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

/** Instancia singleton de PrismaClient lista para usar en toda la app */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

if (process.env.DEBUG_PRISMA_QUERIES === 'true') {
    type PrismaQueryEvent = { query: string; params: string; duration: number }
    ;(prisma as unknown as { $on: (e: string, cb: (ev: PrismaQueryEvent) => void) => void }).$on('query', (e) => {
        console.debug('[prisma] query', { sql: e.query, params: e.params, duration: e.duration })
    })
}