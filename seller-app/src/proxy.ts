import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)'])

const isProtectedApiRoute = createRouteMatcher([
    '/api/orders/(.*)/delivery-started',
    '/api/orders/(.*)/payment-confirmed',
    '/api/orders/(.*)/delivery-status',
    '/api/orders/(.*)/incident'
])

export default clerkMiddleware(async (auth, req) => {
    if (req.nextUrl.pathname.startsWith('/api')) {
        const serviceToken = req.headers.get('X-Service-Token')
        const expectedToken = process.env.SERVICE_TOKEN

        if (isProtectedApiRoute(req)) {
            if (!serviceToken || serviceToken !== expectedToken) {
                return NextResponse.json(
                    { error: 'Unauthorized: Invalid or missing X-Service-Token' },
                    { status: 401 }
                )
            }
        }

        return NextResponse.next()
    }

    if (isPublicRoute(req)) {
        return NextResponse.next()
    }

    const { userId } = await auth()

    if (!userId) {
        return NextResponse.redirect(new URL('/sign-in', req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/api(.*)',
    ],
}
