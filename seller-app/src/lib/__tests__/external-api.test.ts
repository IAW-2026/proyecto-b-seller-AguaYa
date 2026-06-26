/**
 * external-api.test.ts — Tests para el cliente HTTP de servicios externos.
 *
 * Cobertura:
 *   getServiceConfig()        → unit: URL y API key desde env vars
 *   notifyExternalService()   → unit: fetch, headers, body, errores
 *
 * Las variables de entorno se setean con vi.stubEnv() por test.
 * global.fetch se mockea para cada escenario.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Helpers ────────────────────────────────────────────────────────────────

function importModule() {
  return import('@/lib/external-api')
}

/**
 * Mockea global.fetch con una respuesta controlada.
 * Por defecto retorna { ok: true }.
 */
function mockFetch(response?: Partial<Response>) {
  const defaultResponse = { ok: true, status: 200, text: () => Promise.resolve('') }
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ...defaultResponse, ...response } as Response)
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('getServiceConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('retorna la config cuando las env vars están seteadas', async () => {
    vi.stubEnv('DELIVERY_APP_URL', 'http://delivery:3000')
    vi.stubEnv('DELIVERY_API_KEY', 'key-123')

    const { getServiceConfig } = await importModule()
    const config = getServiceConfig('delivery')

    expect(config).toEqual({ baseUrl: 'http://delivery:3000', apiKey: 'key-123' })
  })

  it('retorna null si la URL no está configurada', async () => {
    vi.stubEnv('DELIVERY_APP_URL', '')
    vi.stubEnv('DELIVERY_API_KEY', 'key-123')

    const { getServiceConfig } = await importModule()
    const config = getServiceConfig('delivery')

    expect(config).toBeNull()
  })

  it('retorna apiKey vacía si la KEY no está configurada', async () => {
    vi.stubEnv('DELIVERY_APP_URL', 'http://delivery:3000')
    vi.stubEnv('DELIVERY_API_KEY', '')

    const { getServiceConfig } = await importModule()
    const config = getServiceConfig('delivery')

    expect(config).toEqual({ baseUrl: 'http://delivery:3000', apiKey: '' })
  })
})

describe('notifyExternalService', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = mockFetch()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    fetchSpy.mockRestore()
  })

  it('hace fetch con URL, método y headers correctos', async () => {
    vi.stubEnv('DELIVERY_APP_URL', 'http://delivery:3000')
    vi.stubEnv('DELIVERY_API_KEY', 'delivery-key')

    const { notifyExternalService } = await importModule()
    await notifyExternalService('delivery', '/api/ready_orders/abc', 'PUT', { orderId: 'abc' })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://delivery:3000/api/ready_orders/abc',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer delivery-key' },
        body: JSON.stringify({ orderId: 'abc' }),
      },
    )
  })

  it('incluye X-API-Key solo si está configurada', async () => {
    vi.stubEnv('BUYER_APP_URL', 'http://buyer:4000')
    vi.stubEnv('BUYER_SERVICE_KEY', '')

    const { notifyExternalService } = await importModule()
    await notifyExternalService('buyer', '/api/orders/xyz/status', 'PATCH', { status: 'READY' })

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://buyer:4000/api/orders/xyz/status',
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' }, // sin X-API-Key
      }),
    )
  })

  it('skipea silenciosamente si la URL no está configurada', async () => {
    vi.stubEnv('DELIVERY_APP_URL', '')

    const { notifyExternalService } = await importModule()
    await notifyExternalService('delivery', '/api/ready_orders/abc', 'PUT', { orderId: 'abc' })

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('retorna error si el servicio responde HTTP error', async () => {
    vi.stubEnv('DELIVERY_APP_URL', 'http://delivery:3000')
    fetchSpy.mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('Internal Server Error') } as Response)

    const { notifyExternalService } = await importModule()
    const result = await notifyExternalService('delivery', '/api/ready_orders/abc', 'PUT', {})
    expect(result).toEqual({ success: false, error: 'HTTP 500: Internal Server Error' })
  })

  it('retorna error si hay network error', async () => {
    vi.stubEnv('DELIVERY_APP_URL', 'http://delivery:3000')
    fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'))

    const { notifyExternalService } = await importModule()
    const result = await notifyExternalService('delivery', '/api/ready_orders/abc', 'PUT', {})
    expect(result).toEqual({ success: false, error: 'ECONNREFUSED' })
  })
})
