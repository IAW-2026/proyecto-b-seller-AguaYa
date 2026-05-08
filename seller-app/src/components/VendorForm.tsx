
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrUpdateVendor } from '@/app/actions/vendor'
import Button from '@/components/ui/Button'
import { validateVendorInput } from '../lib/validation'

interface VendorFormProps {
  initialData?: {
    name: string
    address: string
    description?: string
    cuil?: string
    cuit?: string
  }
  redirectTo?: string
}

export default function VendorForm({ initialData, redirectTo }: VendorFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    address: initialData?.address || '',
    description: initialData?.description || '',
    cuil: initialData?.cuil || '',
    cuit: initialData?.cuit || '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = validateVendorInput(formData)

      await createOrUpdateVendor(payload)
      setError('')
      setLoading(false)
      if (redirectTo) {
        router.push(redirectTo)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 12,
    fontFamily: 'inherit',
  }

  const labelStyle = {
    display: 'block',
    marginBottom: 6,
    fontSize: 14,
    fontWeight: 500,
  }

  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 16,
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ padding: 12, backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={containerStyle}>
        <div>
          <label style={labelStyle}>Nombre del negocio *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ej: Agua Pura SA"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Dirección *</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Ej: Av. Mitre 512, Punta Alta"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>CUIL</label>
          <input
            type="text"
            name="cuil"
            value={formData.cuil}
            onChange={handleChange}
            placeholder="Ej: 20-12345678-9"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>CUIT</label>
          <input
            type="text"
            name="cuit"
            value={formData.cuit}
            onChange={handleChange}
            placeholder="Ej: 30-12345678-9"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Descripción del negocio</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Cuéntanos sobre tu negocio..."
          style={{
            ...inputStyle,
            minHeight: 100,
            resize: 'vertical',
          } as React.CSSProperties}
        />
      </div>

      <div style={{ marginTop: 24 }}>
        <Button type="submit" disabled={loading} style={{ cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Guardando...' : 'Guardar datos del vendedor'}
        </Button>
      </div>
    </form>
  )
}
