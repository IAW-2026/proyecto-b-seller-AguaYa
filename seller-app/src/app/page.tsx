/**
 * Página de inicio (`/`) — landing pública de la SellerApp con enlace a iniciar sesión.
 */
export default async function Home() {
    return (
        <main className="grid min-h-screen place-items-center px-6 py-12">
            <div className="max-w-xl rounded-[2rem] border border-white/70 bg-white/80 dark:border-slate-700 dark:bg-slate-900/80 px-8 py-10 text-center shadow-[0_20px_80px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-400">AguaYa Seller</p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">Gestioná tu negocio con menos fricción</h1>
                <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400 sm:text-lg">Accedé al panel para gestionar ventas, productos y pedidos con una interfaz más clara y rápida de leer.</p>
                <a className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700" href="/sign-in">
                    Iniciar sesión
                </a>
            </div>
        </main>
    )
}
