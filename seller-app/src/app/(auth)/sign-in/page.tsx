/**
 * Página de inicio de sesión (`/sign-in`). Renderiza el componente SignIn de Clerk con estilos personalizados.
 */
import { SignIn } from '@clerk/nextjs'

/**
 * Página de login con encabezado de marca y formulario de Clerk.
 */
export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center px-4">
            <div className="mb-8 text-center">
                <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.25l-6.75 6.75v9.75a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V9l-6.75-6.75z" />
                        <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.53.22l6.75 6.75a.75.75 0 01-1.06 1.06L12 4.31 5.78 10.28a.75.75 0 01-1.06-1.06l6.75-6.75a.75.75 0 01.53-.22z" clipRule="evenodd" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-800">AguaYa Seller</h1>
                <p className="text-slate-500 mt-2">Iniciá sesión para gestionar tu negocio</p>
            </div>
            <SignIn
                appearance={{
                    elements: {
                    card: 'shadow-lg rounded-2xl',
                    headerTitle: 'text-xl font-bold',
                    headerSubtitle: 'text-slate-500',
                    socialButtonsBlockButton: 'border-slate-200 hover:bg-slate-50',
                    formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
                    footerActionLink: 'text-blue-600 hover:text-blue-700',
                    }
                }}
                routing="hash"
                fallbackRedirectUrl="/dashboard"
            />
        </div>
    )
}
