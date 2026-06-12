/**
 * Esqueleto de carga para la página de detalle de un vendedor (admin).
 * Muestra los tabs estáticos + un placeholder del contenido del tab Resumen.
 */

export default function AdminVendorLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-1 h-7 w-48 rounded bg-slate-200" />
      <div className="mb-6 h-4 w-64 rounded bg-slate-200" />

      <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1">
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
        <div className="rounded-xl border border-slate-200 bg-white p-6">
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

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-5 w-16 rounded bg-slate-200" />
            <div className="h-4 w-36 rounded bg-slate-200" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
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
