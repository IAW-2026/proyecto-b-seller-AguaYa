import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    throw new Error('DATABASE_URL no está definida')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

// Optional Prisma query logging (enable by setting DEBUG_PRISMA_QUERIES=true)
if (process.env.DEBUG_PRISMA_QUERIES === 'true') {
    ;(prisma as any).$on('query', (e: any) => {
        console.debug('[prisma] query', { sql: e.query, params: e.params, duration: e.duration })
    })
}