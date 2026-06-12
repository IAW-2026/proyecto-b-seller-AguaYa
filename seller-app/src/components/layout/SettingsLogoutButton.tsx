'use client'

import { SignOutButton } from '@clerk/nextjs'

export default function SettingsLogoutButton() {
  return (
    <SignOutButton>
      <button className="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
        Salir
      </button>
    </SignOutButton>
  )
}
