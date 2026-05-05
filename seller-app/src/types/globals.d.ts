export { }

declare global {
    interface CustomJwtSessionClaims {
        metadata?: {
            role?: 'vendor' | 'admin'
        }
    }
}