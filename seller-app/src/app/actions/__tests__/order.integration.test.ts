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
    items: [
      { id: 'item-1', quantity: 1, productId: 'p-1', product: { id: 'p-1' } },
      { id: 'item-2', quantity: 2, productId: 'p-2', product: { id: 'p-2' } },
    ],
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
    items: [
      { id: 'item-1', quantity: 1, productId: 'p-1', product: { id: 'p-1' } },
      { id: 'item-2', quantity: 2, productId: 'p-2', product: { id: 'p-2' } },
    ],
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
    expect(result.order.status).toBe('READY')

    // Delivery recibió POST
    expect(delivery.requests).toHaveLength(1)
    expect(delivery.requests[0]).toMatchObject({
      method: 'POST',
      url: '/api/ready-orders',
      body: {
        pedidos: [{
          id_pedido_externo: expect.any(String),
          id_vendedor: 'vendor-1',
          cliente: expect.any(String),
          direccion: expect.any(String),
          telefono: null,
          cant_bidones: 3,
          zona: null,
        }],
      },
    })
    expect(delivery.requests[0].headers['authorization']).toBe('Bearer delivery-key')

    // Buyer recibió PATCH
    expect(buyer.requests).toHaveLength(1)
    expect(buyer.requests[0]).toMatchObject({
      method: 'PATCH',
      url: '/api/orders/order-1',
      body: { orderStatus: 'READY' },
    })
    expect(buyer.requests[0].headers['x-api-key']).toBe('buyer-key')
  })

  it('incluye los campos requeridos por DeliveryApp en el body', async () => {
    const delivery = await createEchoServer()
    servers.push(delivery)

    process.env.DELIVERY_APP_URL = `http://localhost:${delivery.port}`
    process.env.DELIVERY_API_KEY = 'key'

    const { confirmOrderForDelivery } = await importOrderModule()
    await confirmOrderForDelivery('order-1')

    const body = delivery.requests[0].body
    expect(body.pedidos).toHaveLength(1)
    expect(body.pedidos[0]).toMatchObject({
      id_pedido_externo: expect.any(String),
      id_vendedor: expect.any(String),
      cliente: expect.any(String),
      direccion: expect.any(String),
      telefono: null,
      cant_bidones: expect.any(Number),
      zona: null,
    })
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
    expect(result.order.status).toBe('READY')

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
