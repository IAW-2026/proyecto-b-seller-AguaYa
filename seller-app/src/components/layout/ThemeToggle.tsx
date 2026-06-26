/**
 * ThemeToggle.tsx — Botón para alternar entre tema claro y oscuro.
 */

'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/ThemeProvider'

/** Botón que alterna el tema usando ThemeProvider. */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      className="flex items-center justify-center rounded-xl p-2.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-amber-400" />
      ) : (
        <Moon className="h-5 w-5 text-slate-600" />
      )}
    </button>
  )
}
