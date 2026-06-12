export default function DashboardTableLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="overflow-hidden rounded-xl border border-white/30 bg-white/20 shadow-lg shadow-black/5 backdrop-blur-xl">
        <div className="space-y-0.5">
          <div className="flex gap-4 bg-white/10 px-4 py-3">
            <div className="h-4 w-1/4 rounded bg-white/40" />
            <div className="h-4 w-1/5 rounded bg-white/40" />
            <div className="h-4 w-1/6 rounded bg-white/40" />
            <div className="h-4 w-1/6 rounded bg-white/40" />
            <div className="h-4 w-1/6 rounded bg-white/40" />
            <div className="h-4 w-16 rounded bg-white/40" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-t border-white/10 px-4 py-3">
              <div className="h-4 w-1/4 rounded bg-white/20" />
              <div className="h-4 w-1/5 rounded bg-white/20" />
              <div className="h-4 w-1/6 rounded bg-white/20" />
              <div className="h-4 w-1/6 rounded bg-white/20" />
              <div className="h-4 w-1/6 rounded bg-white/20" />
              <div className="h-6 w-16 rounded-full bg-white/20" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-white/20" />
        <div className="h-8 w-8 rounded-lg bg-white/40" />
        <div className="h-8 w-8 rounded-lg bg-white/20" />
      </div>
    </div>
  )
}
