/**
 * external-api.ts — Cliente HTTP genérico para comunicación con servicios externos.
 *
 * Propósito:
 *   Centralizar las llamadas HTTP a otras apps del ecosistema (DeliveryApp, BuyerApp, etc.)
 *   con manejo automático de autenticación y fallback opcional a Outbox para reintentos.
 *
 * Funciones:
 *   getServiceConfig()      → Obtiene URL y API key desde env vars según el nombre del servicio
 *   notifyExternalService() → Realiza un HTTP call con auth + fallback a Outbox
 *
 * Uso:
 *   notifyExternalService('delivery', '/api/ready_orders/123', 'PUT', { ... }, { enqueueOnFailure: true, orderId: '123' })
 *   notifyExternalService('buyer', '/api/orders/123/status', 'PATCH', { ... })
 */

import { enqueueNotification } from '@/lib/outbox'

export type ExternalService = keyof typeof SERVICE_MAP
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ServiceConfig {
  baseUrl: string
  apiKey: string
}

interface NotifyOptions {
  enqueueOnFailure?: boolean
  orderId?: string
}

const SERVICE_MAP = {
  delivery: { urlEnv: 'DELIVERY_APP_URL', keyEnv: 'DELIVERY_API_KEY' },
  buyer: { urlEnv: 'BUYER_APP_URL', keyEnv: 'BUYER_SERVICE_KEY' },
} as const

/**
 * Obtiene la configuración (URL base + API key) para un servicio externo.
 * Retorna null si la URL no está configurada en las variables de entorno.
 */
export function getServiceConfig(service: ExternalService): ServiceConfig | null {
  const cfg = SERVICE_MAP[service]
  const baseUrl = process.env[cfg.urlEnv]
  if (!baseUrl) return null
  return { baseUrl, apiKey: process.env[cfg.keyEnv] ?? '' }
}

/**
 * Realiza un HTTP call a un servicio externo con autenticación automática.
 *
 * @param service  - Nombre del servicio ('delivery' | 'buyer')
 * @param path     - Ruta del endpoint (ej: '/api/ready_orders/123')
 * @param method   - Método HTTP (PUT, PATCH, POST, etc.)
 * @param body     - Payload a enviar (objeto, se serializa a JSON)
 * @param options  - Opcional: enqueueOnFailure para encolar en Outbox si falla
 *
 * Si la URL no está configurada, skipea silenciosamente.
 * Si falla y enqueueOnFailure está activo, persiste en Outbox para reintento.
 */
export async function notifyExternalService(
  service: ExternalService,
  path: string,
  method: HttpMethod,
  body: Record<string, unknown>,
  options?: NotifyOptions,
) {
  const config = getServiceConfig(service)
  if (!config) {
    console.warn(`[external-api] ${service}: URL no configurada (${SERVICE_MAP[service].urlEnv})`)
    return
  }

  const url = `${config.baseUrl}${path}`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (config.apiKey) {
    headers['X-API-Key'] = config.apiKey
  }

  try {
    const response = await fetch(url, { method, headers, body: JSON.stringify(body) })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text().catch(() => 'sin cuerpo')}`)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    console.warn(`[external-api] Falló ${method} ${url}: ${errorMsg}`)

    if (options?.enqueueOnFailure && options?.orderId) {
      await enqueueNotification(options.orderId, service, method, url, JSON.stringify(body))
    }
  }
}
