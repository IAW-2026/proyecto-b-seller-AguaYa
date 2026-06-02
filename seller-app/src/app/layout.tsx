/**
 * Layout raíz de la SellerApp. Configura Clerk, los tipos de fuente Geist y el proveedor de tema (claro/oscuro).
 */
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import type { Metadata } from 'next'
import ThemeProvider from '@/lib/ThemeProvider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'AguaYa Seller',
    template: '%s | AguaYa Seller',
  },
  description: 'Panel para gestionar productos, pedidos y vendedores de AguaYa.',
}

/**
 * Renderiza el HTML raíz con fuentes, Clerk y ThemeProvider envueltos alrededor de los children.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')})()`,
          }}
        />
      </head>
      <body className="bg-background text-foreground antialiased">
        <ClerkProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}