export default function OverviewLoading() {
  return (
    <div className="flex flex-col gap-6 xl:gap-8 animate-pulse">
      <div className="rounded-[1.5rem] border border-white/30 bg-white/20 px-8 py-5 shadow-lg shadow-black/5 backdrop-blur-xl">
        <div className="mb-2 h-7 w-56 rounded bg-white/40" />
        <div className="h-4 w-80 rounded bg-white/30" />
      </div>

      <div className="flex items-center justify-between rounded-[1.5rem] border border-white/30 bg-white/20 px-8 py-4 shadow-lg shadow-black/5 backdrop-blur-xl">
        <div className="h-4 w-32 rounded bg-white/40" />
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full px-4 py-1.5">
            <div className="h-2 w-2 rounded-full bg-white/40" />
            <div className="h-4 w-14 rounded bg-white/30" />
          </div>
          <div className="h-8 w-16 rounded bg-white/30" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 xl:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/30 bg-white/20 px-6 py-5 shadow-lg shadow-black/5 backdrop-blur-xl">
            <div className="mb-2 h-4 w-20 rounded bg-white/40" />
            <div className="h-9 w-16 rounded bg-white/40" />
          </div>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-6 xl:flex-row xl:gap-6">
        <div className="flex flex-col rounded-[1.5rem] border border-white/30 bg-white/20 p-6 shadow-lg shadow-black/5 backdrop-blur-xl xl:flex-1">
          <div className="mb-3 h-6 w-24 rounded bg-white/40" />
          <div className="flex-1 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 rounded bg-white/30" />
                  <div className="h-3 w-16 rounded bg-white/20" />
                </div>
                <div className="mt-1 h-3 w-36 rounded bg-white/20" />
                <div className="mt-1 h-3 w-full rounded bg-white/20" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col rounded-[1.5rem] border border-white/30 bg-white/20 p-6 shadow-lg shadow-black/5 backdrop-blur-xl xl:w-[480px] xl:shrink-0">
          <div className="mb-4 h-6 w-32 rounded bg-white/40" />
          <div className="flex-1 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
