/**
 * @file OrdersChart.tsx
 * @description Gráfico de barras colapsable que muestra el volumen de órdenes pagadas y listas por día en un rango de fechas.
 */

'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { getOrderChartData } from '@/app/actions/order'

interface ChartData {
  date: string
  paid: number
  ready: number
}

/** Renderiza un gráfico de barras interactivo con las órdenes agrupadas por día. */
export default function OrdersChart({ vendorId }: { vendorId: string }) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [data, setData] = useState<ChartData[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadChart() {
    setLoading(true)
    try {
      const result = await getOrderChartData(vendorId, from, to)
      setData(result)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle() {
    const next = !open
    setOpen(next)
    if (next && !data) {
      await loadChart()
    }
  }

  return (
    <div className="rounded-xl border border-white/30 bg-gradient-to-br from-white/30 to-slate-100/30 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/40 dark:from-slate-900/40 dark:to-slate-800/40">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        <span>Órdenes por día</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="border-t border-slate-200 px-4 pb-4 pt-3 dark:border-slate-700">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <span className="text-sm text-slate-400">a</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={loadChart}
              disabled={loading}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>

          {data && data.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v + 'T00:00:00')
                      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
                    }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    labelFormatter={(v: any) =>
                      new Date(String(v) + 'T00:00:00').toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    }
                  />
                  <Legend />
                  <Bar dataKey="paid" name="Pagadas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ready" name="Listas para entregar" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : data && data.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No hay órdenes en este período
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
