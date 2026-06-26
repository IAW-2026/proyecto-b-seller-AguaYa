/**
 * Validación de autenticación para endpoints inter-servicios
 */

/**
 * Valida que el header X-API-Key sea correcto.
 * Se usa para proteger endpoints que son consumidos por otras aplicaciones.
 */
export function validateApiKey(request: Request, expectedKey: string | undefined): boolean {
  const apiKey = request.headers.get('X-API-Key')

  if (!expectedKey) {
    console.error('API_KEY no configurada en variables de entorno')
    return false
  }

  return apiKey === expectedKey
}

/**
 * Extrae el API key del request header
 */
export function getApiKeyFromRequest(request: Request): string | null {
  return request.headers.get('X-API-Key')
}
