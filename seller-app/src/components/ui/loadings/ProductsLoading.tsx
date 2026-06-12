export default function ProductsLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex flex-col rounded-xl border border-white/30 bg-white/20 p-3 shadow-lg shadow-black/5 backdrop-blur-xl">
          <div className="mb-3 aspect-[4/3] rounded-lg bg-white/20" />
          <div className="mb-1 h-4 w-3/4 rounded bg-white/30" />
          <div className="mb-1.5 h-5 w-1/3 rounded bg-white/40" />
          <div className="h-8 w-full rounded bg-white/20" />
          <div className="mt-2 h-8 w-full rounded-lg bg-white/20" />
        </div>
      ))}
    </div>
  )
}
