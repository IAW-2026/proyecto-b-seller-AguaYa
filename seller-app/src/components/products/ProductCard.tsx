import { Package } from 'lucide-react'
import type { Product } from '@prisma/client'
import UpdateStockButton from './UpdateStockButton'
import ProductFormDialog from './ProductFormDialog'

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200/80 bg-white/80 dark:border-slate-700/80 dark:bg-slate-900/80 p-3 shadow-sm">
      {product.image ? (
        <div className="mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="mb-3 flex aspect-[4/3] items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
          <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />
        </div>
      )}

      <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100 truncate">{product.name}</h3>
      <p className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">${product.price}</p>
      <div className="mt-1.5">
        <UpdateStockButton productId={product.id} currentStock={product.stock} />
      </div>

      <ProductFormDialog
        mode="edit"
        productId={product.id}
        initialData={{
          name: product.name,
          description: product.description || '',
          price: product.price,
          stock: product.stock,
          image: product.image || '',
        }}
      >
        <button type="button" className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-950 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-400 dark:hover:text-white">
          Editar
        </button>
      </ProductFormDialog>
    </div>
  )
}
