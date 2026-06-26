/**
 * @file OrderNotifier.tsx
 * @description Componente oculto que consulta periódicamente el conteo de órdenes pendientes y muestra una notificación del navegador cuando llega una nueva.
 */

'use client'

import { useEffect, useRef } from 'react'

/** Componente invisible que notifica al vendedor cuando se recibe una nueva orden vía Notification API. */
export default function OrderNotifier({ interval = 10000 }: { interval?: number }) {
  const lastCount = useRef<number | null>(null)

  useEffect(() => {
    const check = async () => {
      if (typeof window === 'undefined' || !('Notification' in window)) return

      try {
        const res = await fetch('/api/orders/pending-count')
        if (!res.ok) return
        const { count } = await res.json()

        if (lastCount.current !== null && count > lastCount.current) {
          if (Notification.permission === 'granted') {
            new Notification('AguaYa', { body: '¡Nueva orden recibida!', icon: '/icon.svg' })
          } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission()
            if (permission === 'granted') {
              new Notification('AguaYa', { body: '¡Nueva orden recibida!', icon: '/icon.svg' })
            }
          }
        }

        lastCount.current = count
      } catch {
        // ignore polling errors
      }
    }

    const id = setInterval(check, interval)
    return () => clearInterval(id)
  }, [interval])

  return null
}
