import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Seller App',
  description: 'Plataforma de vendedores',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}

/* Children es la página que Next.js va a renderizar dentro del layout */

/* El componente de Clerk envuelve toda la app y se encarga de la autenticación */