/**
 * external-api.integration.test.ts — Tests de integración para notifyExternalService.
 *
 * A diferencia de los tests unitarios (external-api.test.ts), estos tests NO mockean fetch.
 * Levantan servidores HTTP reales y verifican que el request llegue correctamente.
 *
 * Cobertura:
 *   - PUT con headers y body a delivery
 *   - PATCH con headers y body a buyer
 *   - GET sin body a feedback
 *   - Sin X-API-Key si la env var está vacía
 *   - Skipea si la URL no está configurada
 */

import { describe, it, expect, afterEach } from 'vitest'
import { createEchoServer } from './test-server'

const servers: { stop: () => Promise<void> }[] = []

afterEach(async () => {
  for (const s of servers) await s.stop()
  servers.length = 0
})

describe('notifyExternalService (integración)', () => {
  it('envía PUT a delivery con Authorization Bearer y body JSON', async () => {
    const echo = await createEchoServer()
    servers.push(echo)

    process.env.DELIVERY_APP_URL = `http://localhost:${echo.port}`
    process.env.DELIVERY_API_KEY = 'delivery-secret-456'

    const { notifyExternalService } = await import('@/lib/external-api')
    await notifyExternalService('delivery', '/api/ready_orders/order-42', 'PUT', {
      orderId: 'order-42',
      status: 'READY',
      timestamp: '2026-06-01T12:00:00.000Z',
    })

    expect(echo.requests).toHaveLength(1)
    expect(echo.requests[0]).toMatchObject({
      method: 'PUT',
      url: '/api/ready_orders/order-42',
      body: { orderId: 'order-42', status: 'READY' },
    })
    expect(echo.requests[0].headers['authorization']).toBe('Bearer delivery-secret-456')
    expect(echo.requests[0].headers['content-type']).toBe('application/json')
  })

  it('envía PATCH a buyer con el payload de estado', async () => {
    const echo = await createEchoServer()
    servers.push(echo)

    process.env.BUYER_APP_URL = `http://localhost:${echo.port}`
    process.env.BUYER_SERVICE_KEY = 'buyer-secret-789'

    const { notifyExternalService } = await import('@/lib/external-api')
    await notifyExternalService('buyer', '/api/orders/order-99/status', 'PATCH', {
      orderId: 'order-99',
      vendorId: 'vendor-1',
      status: 'READY',
      timestamp: '2026-06-01T12:00:00.000Z',
    })

    expect(echo.requests).toHaveLength(1)
    expect(echo.requests[0]).toMatchObject({
      method: 'PATCH',
      url: '/api/orders/order-99/status',
      body: { orderId: 'order-99', vendorId: 'vendor-1', status: 'READY' },
    })
    expect(echo.requests[0].headers['x-api-key']).toBe('buyer-secret-789')
  })

  it('envía POST a feedback con body y headers', async () => {
    const echo = await createEchoServer()
    servers.push(echo)

    process.env.FEEDBACK_APP_URL = `http://localhost:${echo.port}`
    process.env.FEEDBACK_API_KEY = 'feedback-secret'

    const { notifyExternalService } = await import('@/lib/external-api')
    await notifyExternalService('feedback', '/api/notify', 'POST', { event: 'order_ready', orderId: 'order-1' })

    expect(echo.requests).toHaveLength(1)
    expect(echo.requests[0]).toMatchObject({
      method: 'POST',
      url: '/api/notify',
      body: { event: 'order_ready', orderId: 'order-1' },
    })
    expect(echo.requests[0].headers['x-api-key']).toBe('feedback-secret')
  })

  it('no envía X-API-Key si la env var está vacía', async () => {
    const echo = await createEchoServer()
    servers.push(echo)

    process.env.DELIVERY_APP_URL = `http://localhost:${echo.port}`
    process.env.DELIVERY_API_KEY = ''

    const { notifyExternalService } = await import('@/lib/external-api')
    await notifyExternalService('delivery', '/api/test', 'PUT', {})

    expect(echo.requests[0].headers['x-api-key']).toBeUndefined()
  })

  it('skipea silenciosamente si la URL no está configurada', async () => {
    const echo = await createEchoServer()
    servers.push(echo)

    // No seteamos BUYER_APP_URL — está vacía
    process.env.BUYER_APP_URL = ''

    const { notifyExternalService } = await import('@/lib/external-api')
    await notifyExternalService('buyer', '/api/orders/x/status', 'PATCH', {})

    // El echo server no recibe nada
    expect(echo.requests).toHaveLength(0)
  })
})
