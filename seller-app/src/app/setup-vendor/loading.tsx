export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-2xl animate-pulse space-y-3">
        <div className="h-4 w-32 rounded bg-slate-200/70" />
        <div className="h-8 w-72 rounded bg-slate-200/50" />
        <div className="h-5 w-96 rounded bg-slate-200/30" />
      </div>
      <div className="mt-8 animate-pulse rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/80 sm:p-8">
        <div className="space-y-4">
          <div className="h-10 w-full rounded-lg bg-slate-200/50" />
          <div className="h-10 w-full rounded-lg bg-slate-200/50" />
          <div className="h-20 w-full rounded-lg bg-slate-200/50" />
        </div>
      </div>
    </div>
  )
}
