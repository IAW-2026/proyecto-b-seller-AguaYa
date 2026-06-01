import { ChevronUp, ChevronDown } from 'lucide-react'

export default function SortIcon({ col, sortBy, sortOrder }: { col: string; sortBy: string | null; sortOrder: string | null }) {
  if (sortBy !== col) return null
  return sortOrder === 'asc' ? <ChevronUp className="ml-1 inline h-3 w-3" /> : <ChevronDown className="ml-1 inline h-3 w-3" />
}
