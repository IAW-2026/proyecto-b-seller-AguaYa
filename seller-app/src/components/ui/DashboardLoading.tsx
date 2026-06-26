export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-10 w-52 rounded-full bg-white/40" />
        <div className="h-5 w-96 max-w-full rounded-full bg-white/30" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/30 bg-gradient-to-br from-white/30 to-slate-100/30 p-5 shadow-lg shadow-black/5 backdrop-blur-xl">
            <div className="h-4 w-24 rounded-full bg-white/40" />
            <div className="mt-4 h-9 w-20 rounded-full bg-white/30" />
            <div className="mt-3 h-4 w-36 rounded-full bg-white/20" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/30 bg-gradient-to-br from-white/30 to-slate-100/30 p-6 shadow-lg shadow-black/5 backdrop-blur-xl">
            <div className="h-5 w-40 rounded-full bg-white/40" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 4 }).map((__, j) => (
                <div key={j} className="h-4 rounded-full bg-white/20" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
