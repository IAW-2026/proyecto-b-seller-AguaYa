/**
 * Icono de ordenamiento para columnas de tabla.
 * Muestra una flecha hacia arriba o abajo según la dirección de orden actual.
 */
import { ChevronUp, ChevronDown } from 'lucide-react'

/** Icono de orden ascendente/descendente para una columna. */
export default function SortIcon({ col, sortBy, sortOrder }: { col: string; sortBy: string | null; sortOrder: string | null }) {
  if (sortBy !== col) return null
  return sortOrder === 'asc' ? <ChevronUp className="ml-1 inline h-3 w-3" /> : <ChevronDown className="ml-1 inline h-3 w-3" />
}
