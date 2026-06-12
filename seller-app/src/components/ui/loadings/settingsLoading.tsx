export default function SettingsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="rounded-xl border border-white/30 bg-white/20 p-6 shadow-lg shadow-black/5 backdrop-blur-xl">
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded bg-white/30" />
          ))}
        </div>
      </div>
    </div>
  )
}
