'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <div className="max-w-xl rounded-[2rem] border border-white/70 bg-white/80 dark:border-slate-700 dark:bg-slate-900/80 px-8 py-10 text-center shadow-[0_20px_80px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-600 dark:text-red-400">Error</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">Algo salió mal</h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400 sm:text-lg">Ocurrió un error inesperado. Intentalo de nuevo.</p>
        <button
          onClick={reset}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          Intentar de nuevo
        </button>
      </div>
    </main>
  )
}
