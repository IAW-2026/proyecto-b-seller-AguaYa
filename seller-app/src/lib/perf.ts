export async function measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now()
  try {
    const res = await fn()
    return res
  } finally {
    const ms = Date.now() - start
    try {
      // Use debug-level logging to avoid noise in production unless enabled
      console.debug(`[perf] ${label}: ${ms}ms`)
    } catch {
      // swallow
    }
  }
}

export function mark(label: string) {
  console.debug(`[perf] mark ${label} @ ${Date.now()}`)
}
