'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-600">Error</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">Algo salió mal</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Ocurrió un error inesperado.</p>
        <button
          onClick={reset}
          className="mt-6 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
