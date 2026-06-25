import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import type { ErrorResponse } from '@/lib/api-types'

type InventoryItem = {
  id: string
  name: string
  isActive: boolean
  productCount: number
  inventoryValue: number
  totalRevenue: number
}

type InventoryResponse = {
  items: InventoryItem[]
  totals: {
    productCount: number
    inventoryValue: number
    totalRevenue: number
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

    const rows = await prisma.$queryRaw<
      {
        id: string
        name: string
        isActive: boolean
        productCount: bigint
        inventoryValue: number
        totalRevenue: number
      }[]
    >`
      SELECT
        v.id,
        v.name,
        v."isActive",
        COUNT(DISTINCT p.id)::int AS "productCount",
        COALESCE(SUM(p.price * p.stock), 0)::float8 AS "inventoryValue",
        COALESCE(SUM(o.total), 0)::float8 AS "totalRevenue"
      FROM "Vendor" v
      LEFT JOIN "Product" p ON p."vendorId" = v.id AND p."deletedAt" IS NULL
      LEFT JOIN "Order" o ON o."vendorId" = v.id AND o."deletedAt" IS NULL
      WHERE v."deletedAt" IS NULL
      GROUP BY v.id, v.name, v."isActive"
      ORDER BY "totalRevenue" DESC
    `

    const items: InventoryItem[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      isActive: r.isActive,
      productCount: Number(r.productCount),
      inventoryValue: Number(r.inventoryValue),
      totalRevenue: Number(r.totalRevenue),
    }))

    const totals: InventoryResponse['totals'] = {
      productCount: items.reduce((s, i) => s + i.productCount, 0),
      inventoryValue: items.reduce((s, i) => s + i.inventoryValue, 0),
      totalRevenue: items.reduce((s, i) => s + i.totalRevenue, 0),
    }

    return NextResponse.json<InventoryResponse>({ items, totals }, { status: 200 })
  } catch (error) {
    console.error('Error en GET /api/admin/vendors/inventory:', error)
    return NextResponse.json<ErrorResponse>(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
