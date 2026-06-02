/**
 * format.ts — Utilidades de formateo de datos.
 */

/**
 * Formatea un CUIL o CUIT argentino en tiempo real mientras el usuario escribe.
 * Elimina caracteres no numéricos y aplica el formato XX-XXXXXXXX-X.
 *
 * @param raw - Valor raw del input (puede incluir guiones, espacios, etc.).
 * @returns String formateado con guiones en las posiciones correctas.
 */
export function formatCuilCuit(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}
