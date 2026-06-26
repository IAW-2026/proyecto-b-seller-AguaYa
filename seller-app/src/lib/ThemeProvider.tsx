/**
 * ThemeProvider.tsx — Proveedor de tema claro/oscuro.
 *
 * Almacena la preferencia en localStorage y respeta la preferencia del sistema
 * (prefers-color-scheme). El estado se sincroniza tras la hidratación para
 * evitar el flash de contenido con el tema incorrecto.
 */
'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** Hook para acceder al tema actual y la función para cambiarlo. */
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

/**
 * Obtiene el tema inicial, priorizando:
 * 1. Valor guardado en localStorage
 * 2. Preferencia del sistema (prefers-color-scheme)
 * 3. 'light' por defecto (SSR)
 */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('theme')
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Proveedor de tema que debe envolver la aplicación.
 * Provee el tema actual y la función toggleTheme via Context.
 */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const actual = getInitialTheme()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(actual)
    document.documentElement.classList.toggle('dark', actual === 'dark')
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
