/**
 * AutoRefresh.tsx — Componente cliente que refresca automáticamente la ruta actual.
 *
 * Útil para páginas que muestran datos en tiempo real (ej. órdenes entrantes).
 * Llama a router.refresh() en un intervalo para re-ejecutar las Server Components
 * y obtener datos actualizados sin recarga de página.
 */
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AutoRefreshProps {
  /** Intervalo en milisegundos entre refrescos (default: 5000). */
  interval?: number
}

/** Renderiza null; el efecto se encarga del refresco periódico. */
export default function AutoRefresh({ interval = 5000 }: AutoRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => router.refresh(), interval)
    return () => clearInterval(id)
  }, [router, interval])

  return null
}
