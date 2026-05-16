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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Alta de vendedor</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Registrá tu negocio</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">Completá los datos principales de tu negocio para comenzar a vender desde el panel de AguaYa.</p>
      </div>

      <div className="mt-8 rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
        <VendorForm redirectTo="/dashboard/overview" />
      </div>
    </div>
  )
}
