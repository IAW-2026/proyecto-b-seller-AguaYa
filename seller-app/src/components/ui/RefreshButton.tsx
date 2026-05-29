'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

export default function RefreshButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [spinning, setSpinning] = useState(false)

  async function handleRefresh() {
    setSpinning(true)
    router.refresh()
    await new Promise((r) => setTimeout(r, 600))
    setSpinning(false)
  }

  return (
    <button
      onClick={handleRefresh}
      className={`inline-flex items-center gap-2 border transition ${
        compact
          ? 'rounded-lg border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-900 hover:text-slate-950 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-400 dark:hover:text-white'
          : 'rounded-full border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-950 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-400 dark:hover:text-white'
      }`}
    >
      <RefreshCw className={`h-4 w-4 transition ${spinning ? 'animate-spin' : ''}`} />
      Recargar
    </button>
  )
}
