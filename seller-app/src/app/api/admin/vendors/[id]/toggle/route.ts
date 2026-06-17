import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import type { ErrorResponse } from '@/lib/api-types'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const cpApiKey = process.env.CONTROL_PLANE_API_KEY
    if (!validateApiKey(request, cpApiKey)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'X-API-Key inválida o faltante' },
        { status: 401 }
      )
    }

    const { id } = await params
    const vendor = await prisma.vendor.findUnique({ where: { id } })
    if (!vendor || vendor.deletedAt) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Vendedor no encontrado' },
        { status: 404 }
      )
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data: { isActive: !vendor.isActive },
    })

    return NextResponse.json({ success: true, vendor: updated }, { status: 200 })
  } catch (error) {
    console.error('Error en PATCH /api/admin/vendors/[id]/toggle:', error)
    return NextResponse.json<ErrorResponse>(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
