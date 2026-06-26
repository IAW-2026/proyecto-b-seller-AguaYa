/**
 * @file AnimatedOrders.tsx
 * @description Muestra órdenes recientes: sin animación si hay menos de 4 (estática), con scroll infinito si hay 4+.
 */

'use client'

type Order = {
  id: string
  status: string
  total: number
  buyerName: string
}

function OrderCard({ order }: { order: Order }) {
  return (
    <div className="rounded-xl border border-white/30 bg-gradient-to-br from-white/30 to-slate-100/30 p-4 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/40 dark:from-slate-900/40 dark:to-slate-800/40">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="truncate text-fluid-sm font-semibold text-slate-900 dark:text-slate-100">
          {order.buyerName || `Orden ${order.id.slice(0, 8)}`}
        </span>
        <span className={`shrink-0 rounded-full px-3 py-1 text-fluid-xs font-medium ${
          order.status === 'PAID'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
        }`}>
          {order.status === 'PAID' ? 'Pagada' : 'Lista'}
        </span>
      </div>
      <p className="mt-1 text-fluid-sm text-slate-500 dark:text-slate-400">${order.total.toFixed(2)}</p>
    </div>
  )
}

/** Renderiza las órdenes recientes: estáticas si hay menos de 4, con scroll animado si hay 4+. */
export default function AnimatedOrders({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No hay órdenes cargadas.</p>
  }

  if (orders.length < 4) {
    return (
      <div className="space-y-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-hidden" style={{ height: '340px' }}>
      <div className="animate-scroll-orders space-y-3">
        {[...orders, ...orders].map((order, i) => (
          <OrderCard key={`${order.id}-${i}`} order={order} />
        ))}
      </div>

      <style>{`
        @keyframes scroll-orders {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-scroll-orders {
          animation: scroll-orders ${orders.length * 4}s linear infinite;
        }
      `}</style>
    </div>
  )
}
