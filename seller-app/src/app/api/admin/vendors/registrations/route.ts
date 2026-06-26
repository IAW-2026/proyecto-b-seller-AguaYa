import { NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'
import { getVendorRegistrations } from '@/lib/queries/vendors'
import type { ErrorResponse } from '@/lib/api-types'

type RecentVendor = {
  id: string
  name: string
  createdAt: Date
}

type RegistrationsResponse = {
  daily: { date: string; count: number }[]
  currentPeriod: number
  previousPeriod: number
  growth: number
  days: number
  recentVendors: RecentVendor[]
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

    const result = await getVendorRegistrations(days)

    return NextResponse.json<RegistrationsResponse>(result, { status: 200 })
  } catch (error) {
    console.error('Error en GET /api/admin/vendors/registrations:', error)
    return NextResponse.json<ErrorResponse>(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
