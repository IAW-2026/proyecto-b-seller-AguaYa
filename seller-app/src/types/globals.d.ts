export { }

declare global {
    interface CustomJwtSessionClaims {
        public_metadata?: {
            role?: 'vendor' | 'admin_vendor'
        }
    }
}