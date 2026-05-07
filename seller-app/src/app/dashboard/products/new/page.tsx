import React from 'react'
import ProductForm from '@/components/ProductForm'

export default function NewProductPage() {
  return (
    <div>
      <h1>Nuevo producto</h1>
      <p>Completa los datos para agregar un producto a tu catálogo.</p>
      <div style={{ marginTop: 16 }}>
        <ProductForm />
      </div>
    </div>
  )
}
