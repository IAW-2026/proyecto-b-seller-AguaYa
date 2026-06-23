import { NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'
import { getVendorActivityByDateRange, getTopVendorsByOrders } from '@/lib/queries/vendors'
import { prisma } from '@/lib/prisma'
import type { ErrorResponse } from '@/lib/api-types'

type ActivityResponse = {
  daily: { date: string; totalOrders: number; activeVendors: number }[]
  topVendors: { vendorId: string; vendorName: string; totalOrders: number }[]
  totalVendors: number
  from: string
  to: string
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
    const now = new Date()
    const to = searchParams.get('to') ?? now.toISOString().slice(0, 10)
    const from = searchParams.get('from') ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const [daily, topVendors, totalVendors] = await Promise.all([
      getVendorActivityByDateRange(from, to),
      getTopVendorsByOrders(from, to, 10),
      prisma.vendor.count({ where: { deletedAt: null } }),
    ])

    return NextResponse.json<ActivityResponse>(
      { daily, topVendors, totalVendors, from, to },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error en GET /api/admin/vendors/activity:', error)
    return NextResponse.json<ErrorResponse>(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
