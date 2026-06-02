/**
 * DashboardLoading.tsx — Esqueleto de carga para la página principal del dashboard.
 */

/** Esqueleto animado que simula tarjetas y paneles del dashboard. */
export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-10 w-52 rounded-full bg-slate-200/80" />
        <div className="h-5 w-96 max-w-full rounded-full bg-slate-200/70" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm">
            <div className="h-4 w-24 rounded-full bg-slate-200/80" />
            <div className="mt-4 h-9 w-20 rounded-full bg-slate-200/70" />
            <div className="mt-3 h-4 w-36 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm">
            <div className="h-5 w-40 rounded-full bg-slate-200/80" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 4 }).map((__, rowIndex) => (
                <div key={rowIndex} className="h-4 rounded-full bg-slate-100" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}