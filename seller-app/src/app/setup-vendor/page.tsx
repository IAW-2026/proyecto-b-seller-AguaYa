/**
 * Página de alta de vendedor (`/setup-vendor`). Muestra el formulario de registro si el usuario no tiene vendedor asociado.
 */
import { auth } from '@clerk/nextjs/server'
import { getVendorByUserId } from '@/lib/queries/vendors'
import { redirect } from 'next/navigation'
import VendorForm from '@/components/VendorForm'

/**
 * Renderiza el formulario de registro del negocio; redirige si ya existe un vendedor.
 */
export default async function SetupVendorPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const vendor = await getVendorByUserId(userId)

  if (vendor) {
    redirect('/dashboard/overview')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-400">Alta de vendedor</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Registrá tu negocio</h1>
        <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-400">Completá los datos principales de tu negocio para comenzar a vender desde el panel de AguaYa.</p>
      </div>

      <div className="mt-8 rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/80 sm:p-8">
        <VendorForm redirectTo="/dashboard/overview" />
      </div>
    </div>
  )
}
