'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  placeholder?: string
  showDateFilter?: boolean
  searchParam?: string
  dateFromParam?: string
  dateToParam?: string
  pageParam?: string
  children?: React.ReactNode
}

export default function SearchBar({
  placeholder = 'Buscar...',
  showDateFilter = false,
  searchParam = 'q',
  dateFromParam = 'from',
  dateToParam = 'to',
  pageParam = 'page',
  children,
}: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(searchParams.get(searchParam) || '')
  const from = searchParams.get(dateFromParam) || ''
  const to = searchParams.get(dateToParam) || ''
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function buildHref(filters: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    params.delete(pageParam)
    const str = params.toString()
    return str ? `${pathname}?${str}` : pathname
  }

  function navigate(filters: Record<string, string>) {
    router.push(buildHref(filters))
  }

  const navigateRef = useRef(navigate)
  navigateRef.current = navigate

  function handleTextChange(value: string) {
    setQ(value)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      navigateRef.current({ [searchParam]: value })
    }, 400)
  }

  function handleDateChange(key: string, value: string) {
    clearTimeout(timer.current)
    navigate({ [key]: value, [searchParam]: q })
  }

  function handleClear() {
    setQ('')
    clearTimeout(timer.current)
    navigate({ [searchParam]: '' })
  }

  useEffect(() => {
    return () => clearTimeout(timer.current)
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={q}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-900 placeholder-slate-400 transition focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-500"
        />
        {q && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDateFilter && (
        <>
          <input
            type="date"
            value={from}
            onChange={(e) => handleDateChange(dateFromParam, e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
          />
          <span className="text-sm text-slate-400">a</span>
          <input
            type="date"
            value={to}
            onChange={(e) => handleDateChange(dateToParam, e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
          />
        </>
      )}
      {children}
    </div>
  )
}
