export { }

declare global {
    interface CustomJwtSessionClaims {
        public_metadata?: {
            roles?: string[]
        }
    }
}
