'use client'

type Order = {
  id: string
  status: string
  total: number
  buyerName: string
}

export default function AnimatedOrders({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No hay órdenes cargadas.</p>
  }

  const itemCount = Math.max(orders.length, 1)

  return (
    <div className="flex flex-col justify-center h-full">
      <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md dark:border-slate-700/30 dark:bg-slate-800/20" style={{ height: '340px' }}>
        <div className="animate-scroll-orders space-y-3 p-3">
          {[...orders, ...orders].map((order, i) => (
            <div key={`${order.id}-${i}`} className="rounded-xl border border-white/20 bg-white/20 p-4 shadow-sm backdrop-blur-md dark:border-slate-700/30 dark:bg-slate-900/40">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {order.buyerName || `Orden ${order.id.slice(0, 8)}`}
                </span>
                <span className={`inline-block shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  order.status === 'PAID'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                }`}>
                  {order.status === 'PAID' ? 'Pagada' : 'Lista'}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">${order.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll-orders {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-scroll-orders {
          animation: scroll-orders ${itemCount * 4}s linear infinite;
        }
      `}</style>
    </div>
  )
}
