/**
 * This is the page where vendors can set up their store for the first time. It checks if the user is authenticated and if they already have a vendor profile. If not, it renders a form to create a new vendor profile.
 */

import React from 'react'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import VendorForm from '@/components/VendorForm'

export default async function SetupVendorPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const vendor = await prisma.vendor.findUnique({
    where: { userId },
  })

  if (vendor) {
    redirect('/dashboard/overview')
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <h1>Registra tu negocio</h1>
      <p>Completa los datos principales de tu negocio para comenzar a vender.</p>

      <div style={{ marginTop: 24 }}>
        <VendorForm redirectTo="/dashboard/overview" />
      </div>
    </div>
  )
}
