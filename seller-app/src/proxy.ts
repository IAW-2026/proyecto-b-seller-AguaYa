import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)'])

export default clerkMiddleware(async (auth, req) => {
    if (req.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next()
    }

    if (isPublicRoute(req)) {
        return NextResponse.next()
    }

    const { userId, sessionClaims } = await auth()

    if (!userId) {
        return NextResponse.redirect(new URL('/sign-in', req.url))
    }

    if (req.nextUrl.pathname.startsWith('/dashboard/admin')) {
        const roles = (sessionClaims?.public_metadata?.roles as string[]) || []
        if (!roles.includes('admin_seller')) {
            return NextResponse.redirect(new URL('/dashboard/overview', req.url))
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/api(.*)',
    ],
}
