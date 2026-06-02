/**
 * @file UpdateStockButton.tsx
 * @description Control inline para modificar el stock de un producto con botones de incremento, decremento y guardado.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProductStock } from '@/app/actions/product'
import { Pencil } from 'lucide-react'

/** Renderiza un control de stock con visualización del valor actual y modo de edición inline. */
export default function UpdateStockButton({
  productId,
  currentStock,
}: {
  productId: string
  currentStock: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState(currentStock)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  if (!isOpen) {
    return (
      <div className="mt-1 flex items-center gap-2 text-sm">
        <span className="text-slate-500 dark:text-slate-400">Stock: {currentStock}</span>
        <button
          type="button"
          onClick={() => {
            setValue(currentStock)
            setIsOpen(true)
          }}
          className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          aria-label="Modificar stock"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  async function handleSave() {
    if (value < 0 || !Number.isInteger(value)) return
    setSaving(true)
    try {
      await updateProductStock(productId, value)
      setSaving(false)
      setIsOpen(false)
      router.refresh()
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="mt-1">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Stock:</span>
        <button
          type="button"
          onClick={() => setValue((v) => Math.max(0, v - 1))}
          className="flex h-7 w-7 items-center justify-center rounded bg-red-500 text-sm font-bold text-white transition hover:bg-red-600"
          aria-label="Disminuir stock"
        >
          −
        </button>
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10)
            setValue(Number.isNaN(n) ? 0 : n)
          }}
          className="w-16 rounded border border-slate-300 px-2 py-1 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
        />
        <button
          type="button"
          onClick={() => setValue((v) => v + 1)}
          className="flex h-7 w-7 items-center justify-center rounded bg-green-500 text-sm font-bold text-white transition hover:bg-green-600"
          aria-label="Aumentar stock"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-slate-900 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? '...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
