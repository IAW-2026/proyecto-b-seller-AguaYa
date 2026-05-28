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

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

// Optional Prisma query logging (enable by setting DEBUG_PRISMA_QUERIES=true)
if (process.env.DEBUG_PRISMA_QUERIES === 'true') {
    type PrismaQueryEvent = { query: string; params: string; duration: number }
    ;(prisma as unknown as { $on: (e: string, cb: (ev: PrismaQueryEvent) => void) => void }).$on('query', (e) => {
        console.debug('[prisma] query', { sql: e.query, params: e.params, duration: e.duration })
    })
}