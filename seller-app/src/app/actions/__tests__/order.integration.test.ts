/**
 * order.integration.test.ts — Tests de integración para confirmOrderForDelivery.
 *
 * A diferencia del test unitario (order.test.ts), este test NO mockea notifyExternalService.
 * Levanta servidores HTTP echo para delivery y buyer, y verifica que los request
 * lleguen realmente con el método, URL, headers y body correctos.
 *
 * Mocks necesarios (no podemos evitarlos):
 *   - Prisma (findFirst, update) — no hay DB real en tests
 *   - getAuthenticatedVendor — no hay sesión de Clerk
 *   - revalidatePath — no-op de Next.js
 *
 * Lo que NO se mockea:
 *   - notifyExternalService → real, hace fetch contra los echo servers
 *   - fetch global → real (usa el protocolo HTTP de Node)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createEchoServer } from '@/lib/__tests__/test-server'

// ─── Mocks hoisteados ───────────────────────────────────────────────────────
// Solo se mockea lo que no podemos tener en test: DB, auth, Next.js internals.
// external-api.ts se DEJA REAL para verificar el tráfico HTTP.

const mockVendor = vi.fn()
vi.mock('@/lib/auth-utils', () => ({
  getAuthenticatedVendor: mockVendor,
}))

const mockFindFirst = vi.fn()
const mockUpdate = vi.fn()
vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findFirst: mockFindFirst,
      update: mockUpdate,
    },
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/queries/orders', () => ({
  getVendorOrders: vi.fn(),
  getVendorOrdersByDateRange: vi.fn(),
}))

// ─── Helpers ────────────────────────────────────────────────────────────────

function importOrderModule() {
  return import('@/app/actions/order')
}

const servers: { stop: () => Promise<void> }[] = []

beforeEach(() => {
  vi.clearAllMocks()
  mockVendor.mockResolvedValue({ id: 'vendor-1' })
  mockFindFirst.mockResolvedValue({
    id: 'order-1',
    externalId: 'EXT-001',
    status: 'PAID',
    vendorId: 'vendor-1',
    buyerId: 'buyer-1',
    buyerName: 'Test Buyer',
    total: 100,
    address: 'Calle 123',
    createdAt: new Date('2026-06-01'),
    deletedAt: null,
    items: [],
  })
  mockUpdate.mockResolvedValue({
    id: 'order-1',
    externalId: 'EXT-001',
    status: 'READY',
    vendorId: 'vendor-1',
    buyerId: 'buyer-1',
    buyerName: 'Test Buyer',
    total: 100,
    address: 'Calle 123',
    createdAt: new Date('2026-06-01'),
    deletedAt: null,
    items: [],
  })
})

afterEach(async () => {
  for (const s of servers) await s.stop()
  servers.length = 0
  delete process.env.DELIVERY_APP_URL
  delete process.env.DELIVERY_API_KEY
  delete process.env.BUYER_APP_URL
  delete process.env.BUYER_SERVICE_KEY
})

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('confirmOrderForDelivery (integración)', () => {
  it('envía PUT a delivery echo server y PATCH a buyer echo server', async () => {
    const delivery = await createEchoServer()
    const buyer = await createEchoServer()
    servers.push(delivery, buyer)

    process.env.DELIVERY_APP_URL = `http://localhost:${delivery.port}`
    process.env.DELIVERY_API_KEY = 'delivery-key'
    process.env.BUYER_APP_URL = `http://localhost:${buyer.port}`
    process.env.BUYER_SERVICE_KEY = 'buyer-key'

    const { confirmOrderForDelivery } = await importOrderModule()
    const result = await confirmOrderForDelivery('order-1')

    // Verificar que la orden se actualizó localmente
    expect(result.status).toBe('READY')

    // Delivery recibió PUT
    expect(delivery.requests).toHaveLength(1)
    expect(delivery.requests[0]).toMatchObject({
      method: 'PUT',
      url: '/api/ready_orders/order-1',
      body: { orderId: 'order-1', vendorId: 'vendor-1', status: 'READY' },
    })
    expect(delivery.requests[0].headers['x-api-key']).toBe('delivery-key')

    // Buyer recibió PATCH
    expect(buyer.requests).toHaveLength(1)
    expect(buyer.requests[0]).toMatchObject({
      method: 'PATCH',
      url: '/api/orders/order-1/status',
      body: { orderId: 'order-1', vendorId: 'vendor-1', status: 'READY' },
    })
    expect(buyer.requests[0].headers['x-api-key']).toBe('buyer-key')
  })

  it('incluye timestamp ISO en el body de ambos servicios', async () => {
    const delivery = await createEchoServer()
    const buyer = await createEchoServer()
    servers.push(delivery, buyer)

    process.env.DELIVERY_APP_URL = `http://localhost:${delivery.port}`
    process.env.DELIVERY_API_KEY = 'key'
    process.env.BUYER_APP_URL = `http://localhost:${buyer.port}`
    process.env.BUYER_SERVICE_KEY = 'key'

    const { confirmOrderForDelivery } = await importOrderModule()
    await confirmOrderForDelivery('order-1')

    const ts1 = delivery.requests[0].body.timestamp as string
    const ts2 = buyer.requests[0].body.timestamp as string
    expect(new Date(ts1).toISOString()).toBe(ts1)
    expect(new Date(ts2).toISOString()).toBe(ts2)
  })

  it('no bloquea si un servicio externo no está disponible (fire-and-forget)', async () => {
    // Solo levantamos buyer, NO delivery → delivery falla con ECONNREFUSED
    const buyer = await createEchoServer()
    servers.push(buyer)

    // Delivery apunta a un puerto sin server
    process.env.DELIVERY_APP_URL = 'http://localhost:18799'
    process.env.DELIVERY_API_KEY = 'key'
    process.env.BUYER_APP_URL = `http://localhost:${buyer.port}`
    process.env.BUYER_SERVICE_KEY = 'key'

    const { confirmOrderForDelivery } = await importOrderModule()
    const result = await confirmOrderForDelivery('order-1')

    // La orden se actualizó igual
    expect(result.status).toBe('READY')

    // Buyer sí recibió el request
    expect(buyer.requests).toHaveLength(1)
  })

  it('envía content-type application/json en ambos requests', async () => {
    const delivery = await createEchoServer()
    const buyer = await createEchoServer()
    servers.push(delivery, buyer)

    process.env.DELIVERY_APP_URL = `http://localhost:${delivery.port}`
    process.env.DELIVERY_API_KEY = 'key'
    process.env.BUYER_APP_URL = `http://localhost:${buyer.port}`
    process.env.BUYER_SERVICE_KEY = 'key'

    const { confirmOrderForDelivery } = await importOrderModule()
    await confirmOrderForDelivery('order-1')

    expect(delivery.requests[0].headers['content-type']).toBe('application/json')
    expect(buyer.requests[0].headers['content-type']).toBe('application/json')
  })
})
