'use client'

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | 'ellipsis')[] = [1]

  if (current > 3) pages.push('ellipsis')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) pages.push('ellipsis')

  if (total > 1) pages.push(total)

  return pages
}

export default function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}) {
  if (pageCount <= 1) return null

  const pages = getPageNumbers(page, pageCount)

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg px-3 py-1.5 text-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        Anterior
      </button>
      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e${i}`} className="px-2 text-slate-400 dark:text-slate-500">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              p === page
                ? 'bg-slate-900 text-white dark:bg-slate-700'
                : 'border border-slate-200 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        className="rounded-lg px-3 py-1.5 text-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        Siguiente
      </button>
    </div>
  )
}
