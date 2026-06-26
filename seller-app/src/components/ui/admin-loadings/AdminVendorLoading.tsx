/**
 * Esqueleto de carga para la página de detalle de un vendedor (admin).
 * Muestra los tabs estáticos + un placeholder del contenido del tab Resumen.
 */

export default function AdminVendorLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-1 h-7 w-48 rounded bg-slate-200" />
      <div className="mb-6 h-4 w-64 rounded bg-slate-200" />

      <div className="mb-6 flex gap-1 rounded-xl bg-gradient-to-br from-slate-100/70 to-slate-200/50 p-1 dark:from-slate-800/60 dark:to-slate-800/40">
        <div className="flex-1 rounded-lg bg-white px-4 py-2 shadow-sm">
          <div className="mx-auto h-4 w-16 rounded bg-slate-200" />
        </div>
        <div className="flex-1 rounded-lg px-4 py-2">
          <div className="mx-auto h-4 w-16 rounded bg-slate-200" />
        </div>
        <div className="flex-1 rounded-lg px-4 py-2">
          <div className="mx-auto h-4 w-14 rounded bg-slate-200" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-white/30 bg-gradient-to-br from-white/30 to-slate-100/30 p-6 shadow-lg shadow-black/5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-5 w-44 rounded bg-slate-200" />
            <div className="flex gap-2">
              <div className="h-8 w-20 rounded bg-slate-200" />
              <div className="h-8 w-20 rounded bg-slate-200" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="h-3 w-12 rounded bg-slate-200" />
              <div className="h-4 w-32 rounded bg-slate-200" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-14 rounded bg-slate-200" />
              <div className="h-4 w-40 rounded bg-slate-200" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-10 rounded bg-slate-200" />
              <div className="h-4 w-24 rounded bg-slate-200" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-10 rounded bg-slate-200" />
              <div className="h-4 w-28 rounded bg-slate-200" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-12 rounded bg-slate-200" />
              <div className="h-6 w-16 rounded-full bg-slate-200" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/30 bg-gradient-to-br from-white/30 to-slate-100/30 p-6 shadow-lg shadow-black/5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-5 w-16 rounded bg-slate-200" />
            <div className="h-4 w-36 rounded bg-slate-200" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/20 bg-gradient-to-br from-white/20 to-slate-100/20 p-4 backdrop-blur-md">
                <div className="mb-1 flex items-center justify-between">
                  <div className="h-4 w-28 rounded bg-slate-200" />
                  <div className="h-3 w-20 rounded bg-slate-200" />
                </div>
                <div className="mb-1 flex gap-0.5">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <div key={j} className="h-4 w-4 rounded bg-slate-200" />
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="h-3 w-full rounded bg-slate-200" />
                  <div className="h-3 w-3/4 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
