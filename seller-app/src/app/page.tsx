/**
 * Página de inicio (`/`) — landing pública de la SellerApp con enlace a iniciar sesión.
 */
export default async function Home() {
    return (
        <main className="grid min-h-screen place-items-center px-6 py-12">
            <div className="max-w-xl rounded-[2rem] border border-white/30 bg-gradient-to-br from-white/30 to-slate-100/30 px-8 py-10 text-center shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/40 dark:from-slate-900/40 dark:to-slate-800/40">
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
