export default function OrdersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-xl border border-white/30 bg-gradient-to-br from-white/30 to-slate-100/30 p-6 shadow-lg shadow-black/5 backdrop-blur-xl">
        <div className="h-2 w-15 rounded bg-white/40" />
      </div>

      <div className="h-10 w-full rounded-xl border border-white/30 bg-gradient-to-br from-white/30 to-slate-100/30 shadow-lg shadow-black/5 backdrop-blur-xl" />

      <div className="flex gap-1 rounded-xl bg-gradient-to-br from-slate-100/70 to-slate-200/50 p-1 w-fit dark:from-slate-800/60 dark:to-slate-800/40">
        <div className="rounded-lg bg-white/30 px-4 py-2">
          <div className="h-4 w-28 rounded bg-white/40" />
        </div>
        <div className="rounded-lg px-4 py-2">
          <div className="h-4 w-32 rounded bg-white/20" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col rounded-xl border border-white/30 bg-gradient-to-br from-white/30 to-slate-100/30 p-4 shadow-lg shadow-black/5 backdrop-blur-xl">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <div className="h-4 w-28 rounded bg-white/40" />
                <div className="h-3 w-36 rounded bg-white/20" />
              </div>
              <div className="h-5 w-20 rounded-full bg-white/30" />
            </div>
            <div className="mb-2 space-y-1">
              <div className="h-3 w-24 rounded bg-white/20" />
              <div className="h-3 w-40 rounded bg-white/20" />
            </div>
            <div className="mb-3 h-4 w-16 rounded bg-white/40" />
            <div className="space-y-1">
              {Array.from({ length: 2 }).map((__, j) => (
                <div key={j} className="h-3 w-full rounded bg-white/20" />
              ))}
            </div>
            <div className="mt-3 h-9 w-full rounded-lg bg-white/30" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-white/20" />
        <div className="h-8 w-8 rounded-lg bg-white/40" />
        <div className="h-8 w-8 rounded-lg bg-white/20" />
      </div>
    </div>
  )
}
