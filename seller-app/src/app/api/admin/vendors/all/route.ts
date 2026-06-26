import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import type { ErrorResponse } from '@/lib/api-types'
import type { Vendor } from '@prisma/client'

type VendorAllItem = Pick<Vendor, 'id' | 'name' | 'isActive'> & {
  _count: { products: number; orders: number }
}

type AllVendorsResponse = {
  items: VendorAllItem[]
  total: number
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

    const vendors = await prisma.vendor.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        isActive: true,
        _count: { select: { products: true, orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json<AllVendorsResponse>(
      { items: vendors, total: vendors.length },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error en GET /api/admin/vendors/all:', error)
    return NextResponse.json<ErrorResponse>(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
