/**
 * outbox.ts — Sistema de cola de notificaciones para servicios externos.
 *
 * Propósito:
 *   Cuando falla una notificación a un servicio externo al confirmar
 *   una orden como READY, se encola en la tabla Outbox para reintentar
 *   automáticamente cada 60 segundos.
 *
 * Funciones:
 *   enqueueNotification()  → Inserta un registro pendiente en Outbox
 *   processOutbox()        → Reintenta notificaciones pendientes
 *   startOutboxProcessor() → Inicia setInterval que corre processOutbox cada 60s
 *
 * La autenticación (API key) se resuelve a través de getServiceConfig()
 * de external-api.ts, centralizando el mapping servicio → env vars.
 */

import { prisma } from '@/lib/prisma'
import { getServiceConfig } from '@/lib/external-api'
import type { ExternalService } from '@/lib/external-api'

const MAX_RETRIES = 10
const PROCESS_INTERVAL_MS = 60_000

/**
 * Inserta una notificación pendiente en la cola Outbox.
 * Se llama cuando un HTTP call a un servicio externo falla.
 */
export async function enqueueNotification(
  orderId: string,
  target: string,
  method: string,
  url: string,
  body: string,
) {
  await prisma.outbox.create({
    data: { orderId, target, method, url, body },
  })
}

/**
 * Procesa todas las notificaciones pendientes en la cola Outbox.
 * Para cada una, reintenta el HTTP call resolviendo la API key
 * desde getServiceConfig().
 *   - Éxito → marca status = 'SENT'
 *   - Fracaso → incrementa retries; si supera MAX_RETRIES → marca 'FAILED'
 *
 * Safety: si prisma.outbox no está disponible (modelo no generado aún),
 * se loguea un warning sin crashear el proceso.
 */
export async function processOutbox() {
  if (!('outbox' in prisma)) {
    console.warn('[outbox] Modelo Outbox no disponible en PrismaClient. Re-generar con: npx prisma generate')
    return
  }

  const pending = await prisma.outbox.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
  })

  for (const notification of pending) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }

    const config = getServiceConfig(notification.target as ExternalService)
    if (config?.apiKey) {
      headers['X-API-Key'] = config.apiKey
    }

    try {
      const response = await fetch(notification.url, {
        method: notification.method,
        headers,
        body: notification.body,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text().catch(() => 'sin cuerpo')}`)
      }

      await prisma.outbox.update({
        where: { id: notification.id },
        data: { status: 'SENT', lastError: null },
      })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      const newRetries = notification.retries + 1
      const newStatus = newRetries >= MAX_RETRIES ? 'FAILED' : 'PENDING'

      await prisma.outbox.update({
        where: { id: notification.id },
        data: {
          retries: newRetries,
          lastError: errorMsg,
          status: newStatus,
        },
      })
    }
  }
}

/**
 * Inicia el procesador periódico de la cola Outbox.
 * Corre cada PROCESS_INTERVAL_MS (60s) y solo se activa en el servidor en runtime
 * (no durante el build de Next.js).
 */
export function startOutboxProcessor() {
  const isBuildTime =
    process.env.NODE_ENV === 'production' &&
    process.argv.some((a) => a.includes('build'))

  if (typeof setInterval !== 'undefined' && !isBuildTime) {
    setInterval(() => {
      processOutbox().catch((err) =>
        console.error('[outbox] Error procesando notificaciones:', err),
      )
    }, PROCESS_INTERVAL_MS)
  }
}
