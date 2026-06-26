/**
 * LogoutButton.tsx — Botón de cierre de sesión usando Clerk.
 */

'use client'

import { SignOutButton } from '@clerk/nextjs'
import Button from './ui/Button'

/** Botón que cierra la sesión del usuario mediante Clerk. */
export default function LogoutButton() {
  return (
    <SignOutButton>
      <Button variant="danger" fullWidth>
        Cerrar sesión
      </Button>
    </SignOutButton>
  )
}
