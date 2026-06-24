import { NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'
import { getVendorGrowth } from '@/lib/queries/vendors'
import type { ErrorResponse } from '@/lib/api-types'

type GrowthVendor = {
  vendorId: string
  vendorName: string
  currentOrders: number
  previousOrders: number
  growth: number
  trend: number[]
}

type GrowthResponse = {
  vendors: GrowthVendor[]
  days: number
  summary: {
    avgGrowth: number
    growing: number
    declining: number
    stable: number
  }
}

export async function GET(request: Request) {
  try {
    const cpApiKey = process.env.CONTROL_PLANE_API_KEY
    if (!validateApiKey(request, cpApiKey)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'X-API-Key inválida o faltante' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = Math.min(Math.max(parseInt(searchParams.get('days') ?? '30', 10), 7), 365)

    const result = await getVendorGrowth(days)

    return NextResponse.json<GrowthResponse>(result, { status: 200 })
  } catch (error) {
    console.error('Error en GET /api/admin/vendors/growth:', error)
    return NextResponse.json<ErrorResponse>(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
