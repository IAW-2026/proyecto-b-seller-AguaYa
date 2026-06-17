import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import { getOrderById } from '@/lib/queries/orders'
import type { ErrorResponse } from '@/lib/api-types'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const cpApiKey = process.env.CONTROL_PLANE_API_KEY
    if (!validateApiKey(request, cpApiKey)) {
      return NextResponse.json<ErrorResponse>({ error: 'X-API-Key inválida o faltante' }, { status: 401 })
    }

    const { id } = await params
    const order = await getOrderById(id)

    if (!order) {
      return NextResponse.json<ErrorResponse>({ error: 'Orden no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, order }, { status: 200 })
  } catch (error) {
    console.error('Error en GET /api/admin/orders/[id]:', error)
    return NextResponse.json<ErrorResponse>({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const cpApiKey = process.env.CONTROL_PLANE_API_KEY
    if (!validateApiKey(request, cpApiKey)) {
      return NextResponse.json<ErrorResponse>({ error: 'X-API-Key inválida o faltante' }, { status: 401 })
    }

    const { id } = await params
    const order = await prisma.order.findFirst({ where: { id, deletedAt: null } })
    if (!order) {
      return NextResponse.json<ErrorResponse>({ error: 'Orden no encontrada' }, { status: 404 })
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true, order: updated }, { status: 200 })
  } catch (error) {
    console.error('Error en DELETE /api/admin/orders/[id]:', error)
    return NextResponse.json<ErrorResponse>({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
