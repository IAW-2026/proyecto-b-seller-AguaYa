import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isVendorRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth()
    const role = sessionClaims?.metadata?.role

    if (isAdminRoute(req)) {
        if (!userId || role !== 'admin') {
            return NextResponse.redirect(new URL('/', req.url))
        }
    }

    if (isVendorRoute(req)) {
        if (!userId || role !== 'vendor') {
            return NextResponse.redirect(new URL('/', req.url))
        }
    }
})

export const config = {
    matcher: [
        // Ignorar rutas de archivos
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // También ignorar rutas de API
        '/(api|trpc)(.*)',
    ],
}