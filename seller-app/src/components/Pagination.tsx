'use client'

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

  function getPageNumbers(): (number | 'ellipsis')[] {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, i) => i + 1)
    }

    const pages: (number | 'ellipsis')[] = [1]

    if (page > 4) {
      pages.push('ellipsis')
    }

    const start = Math.max(2, page - 2)
    const end = Math.min(pageCount - 1, page + 2)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (page < pageCount - 3) {
      pages.push('ellipsis')
    }

    pages.push(pageCount)

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg px-3 py-1.5 text-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-slate-700 dark:hover:bg-slate-800"
      >
        Anterior
      </button>
      {pageNumbers.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-slate-400 dark:text-slate-500">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              p === page
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        className="rounded-lg px-3 py-1.5 text-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-slate-700 dark:hover:bg-slate-800"
      >
        Siguiente
      </button>
    </div>
  )
}
