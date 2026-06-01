export default function DashboardTableLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-full max-w-xs rounded-lg bg-slate-200/70" />
      <div className="flex gap-2">
        <div className="h-8 w-20 rounded-lg bg-slate-200/70" />
        <div className="h-8 w-20 rounded-lg bg-slate-200/50" />
        <div className="h-8 w-20 rounded-lg bg-slate-200/50" />
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200/60">
        <div className="space-y-0.5">
          <div className="flex gap-4 bg-slate-100/50 px-4 py-3">
            <div className="h-4 w-1/4 rounded bg-slate-200/70" />
            <div className="h-4 w-1/5 rounded bg-slate-200/70" />
            <div className="h-4 w-1/6 rounded bg-slate-200/70" />
            <div className="h-4 w-1/6 rounded bg-slate-200/70" />
            <div className="h-4 w-1/6 rounded bg-slate-200/70" />
            <div className="h-4 w-16 rounded bg-slate-200/70" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-t border-slate-100/50 px-4 py-3">
              <div className="h-4 w-1/4 rounded bg-slate-200/40" />
              <div className="h-4 w-1/5 rounded bg-slate-200/40" />
              <div className="h-4 w-1/6 rounded bg-slate-200/40" />
              <div className="h-4 w-1/6 rounded bg-slate-200/40" />
              <div className="h-4 w-1/6 rounded bg-slate-200/40" />
              <div className="h-6 w-16 rounded-full bg-slate-200/40" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-slate-200/50" />
        <div className="h-8 w-8 rounded-lg bg-slate-200/70" />
        <div className="h-8 w-8 rounded-lg bg-slate-200/50" />
      </div>
    </div>
  )
}
