'use client'

import { SignOutButton } from '@clerk/nextjs'
import Button from './ui/Button'

export default function LogoutButton() {
  return (
    <SignOutButton>
      <Button variant="danger" fullWidth>
        Cerrar sesión
      </Button>
    </SignOutButton>
  )
}
