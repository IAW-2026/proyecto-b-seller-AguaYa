/**
 * order.test.ts — Tests para las server actions de órdenes.
 *
 * Cobertura:
 *   confirmOrderForDelivery()   → unit: flujo feliz, transición inválida, fire-and-forget
 *   updateOrderStatus()        → unit: transición válida, inválida, orden no encontrada
 *
 * Mocks externos:
 *   - Prisma (findFirst, update)
 *   - notifyExternalService (fire-and-forget)
 *   - getAuthenticatedVendor (vendor autenticado)
 *   - revalidatePath (no-op de Next.js)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks hoisteados ───────────────────────────────────────────────────────
// Se declaran antes de los imports para que Vitest los mueva al tope del archivo.

const mockNotify = vi.fn()
vi.mock('@/lib/external-api', () => ({
  notifyExternalService: mockNotify,
}))

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

function importModule() {
  return import('@/app/actions/order')
}

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('updateOrderStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVendor.mockResolvedValue({ id: 'vendor-1' })
  })

  it('actualiza el status cuando la transición es válida (PAID → READY)', async () => {
    mockFindFirst.mockResolvedValue(makeOrder())
    const updatedOrder = makeOrder({ status: 'READY', createdAt: new Date('2026-06-01') })
    mockUpdate.mockResolvedValue(updatedOrder)

    const { updateOrderStatus } = await importModule()
    const result = await updateOrderStatus('order-1', 'READY')

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: 'READY' },
      include: { items: { include: { product: true } } },
    })
    expect(result.status).toBe('READY')
  })

  it('lanza error si la transición no es válida (READY → PAID)', async () => {
    mockFindFirst.mockResolvedValue(makeOrder({ status: 'READY' }))

    const { updateOrderStatus } = await importModule()
    await expect(updateOrderStatus('order-1', 'PAID')).rejects.toThrow(
      'No se puede cambiar una orden READY a PAID',
    )
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('lanza error si la orden pertenece a otro vendedor', async () => {
    mockFindFirst.mockResolvedValue(null)

    const { updateOrderStatus } = await importModule()
    await expect(updateOrderStatus('order-1', 'READY')).rejects.toThrow(
      'No se encontró la orden para este vendedor',
    )
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})

describe('confirmOrderForDelivery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVendor.mockResolvedValue({ id: 'vendor-1' })
    mockFindFirst.mockResolvedValue(makeOrder())
    mockUpdate.mockResolvedValue(makeOrder({ status: 'READY', createdAt: new Date('2026-06-01') }))
  })

  it('notifica a delivery y buyer con el payload correcto', async () => {
    const { confirmOrderForDelivery } = await importModule()
    const result = await confirmOrderForDelivery('order-1')

    expect(mockNotify).toHaveBeenCalledTimes(2)
    expect(mockNotify).toHaveBeenCalledWith(
      'delivery',
      '/api/ready-orders',
      'POST',
      {
        pedidos: [{
          id_pedido_externo: 'EXT-001',
          id_vendedor: 'vendor-1',
          cliente: 'Test Buyer',
          direccion: 'Calle 123',
          telefono: null,
          cant_bidones: 3,
          zona: null,
        }],
      },
    )
    expect(mockNotify).toHaveBeenCalledWith(
      'buyer',
      '/api/orders/order-1',
      'PATCH',
      { orderStatus: 'READY' },
    )
    expect(result.order.status).toBe('READY')
  })

  it('incluye cant_bidones basado en la suma de items', async () => {
    const { confirmOrderForDelivery } = await importModule()
    await confirmOrderForDelivery('order-1')

    const deliveryCall = mockNotify.mock.calls.find(
      (c: unknown[]) => c[0] === 'delivery',
    )
    expect(deliveryCall[3].pedidos[0].cant_bidones).toBe(3) // item qty=1 + qty=2
  })

  it('retorna la orden actualizada incluso si las notificaciones fallan (fire-and-forget)', async () => {
    mockNotify.mockResolvedValue({ success: false, error: 'Service unavailable' })

    const { confirmOrderForDelivery } = await importModule()
    const result = await confirmOrderForDelivery('order-1')

    expect(result.order.status).toBe('READY')
    expect(result.notifications.delivery.success).toBe(false)
    expect(result.notifications.buyer.success).toBe(false)
    expect(mockNotify).toHaveBeenCalledTimes(2)
  })

  it('no envía notificaciones si la transición no es válida', async () => {
    mockFindFirst.mockResolvedValue(makeOrder({ status: 'READY' }))

    const { confirmOrderForDelivery } = await importModule()
    await expect(confirmOrderForDelivery('order-1')).rejects.toThrow()
    expect(mockNotify).not.toHaveBeenCalled()
  })
})
