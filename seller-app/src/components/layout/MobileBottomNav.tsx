/**
 * MobileBottomNav.tsx — Barra de navegación inferior para dispositivos móviles.
 * Muestra enlaces del dashboard, acceso a FeedbackApp y botón de cierre de sesión.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
import { LogOut } from 'lucide-react'
import { dashboardLinks, feedbackLink, iconMap } from '@/lib/navigation'

const activeClass = 'text-slate-900 dark:text-slate-100'
const inactiveClass = 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
const disabledClass = 'text-slate-400 cursor-not-allowed opacity-50 dark:text-slate-600'

/** Navegación inferior fija visible en pantallas menores a xl. */
export default function MobileBottomNav({ roles, feedbackAppUrl }: { roles?: string[]; feedbackAppUrl?: string }) {
  const pathname = usePathname()
  const isAdmin = roles?.includes('admin_seller')
  const visibleLinks = dashboardLinks.filter((l) => l.showFor === 'all' || (l.showFor === 'admin') === isAdmin)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 xl:hidden">
      <ul className="flex justify-around py-2">
        {visibleLinks.map((l) => {
          const LinkIcon = iconMap[l.icon]
          const isActive = pathname.startsWith(l.href)
          return (
            <li key={l.href}>
              <Link href={l.href} className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors ${isActive ? activeClass : inactiveClass}`}>
                <LinkIcon className="h-5 w-5" aria-hidden="true" />
                {l.label}
              </Link>
            </li>
          )
        })}
        {!isAdmin && (
          <li>
            {(() => {
              const FeedbackIcon = iconMap[feedbackLink.icon]
              return feedbackAppUrl ? (
                <a href={feedbackAppUrl} target="_blank" rel="noopener noreferrer" className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors ${inactiveClass}`}>
                  <FeedbackIcon className="h-5 w-5" aria-hidden="true" />
                  {feedbackLink.label}
                </a>
              ) : (
                <span className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium ${disabledClass}`} title="No disponible: falta configurar la URL de FeedbackApp">
                  <FeedbackIcon className="h-5 w-5" aria-hidden="true" />
                  {feedbackLink.label}
                </span>
              )
            })()}
          </li>
        )}
        <li>
          <SignOutButton>
            <button className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" aria-label="Cerrar sesión">
              <LogOut className="h-5 w-5" aria-hidden="true" />
              Salir
            </button>
          </SignOutButton>
        </li>
      </ul>
    </nav>
  )
}
