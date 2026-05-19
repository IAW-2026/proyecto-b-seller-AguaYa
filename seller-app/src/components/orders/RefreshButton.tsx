'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

export default function RefreshButton() {
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
      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
    >
      <RefreshCw className={`h-4 w-4 transition ${spinning ? 'animate-spin' : ''}`} />
      Recargar
    </button>
  )
}
