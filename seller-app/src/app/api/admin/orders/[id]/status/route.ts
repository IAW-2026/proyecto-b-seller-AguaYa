import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import type { ErrorResponse } from '@/lib/api-types'

interface RouteParams {
  params: Promise<{ id: string }>
}

const VALID_STATUSES = ['PAID', 'READY'] as const

export async function PATCH(request: Request, { params }: RouteParams) {
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

    const body = await request.json()
    const { status } = body

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json<ErrorResponse>(
        { error: `Estado inválido. Valores permitidos: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ success: true, order: updated }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('Error en PATCH /api/admin/orders/[id]/status:', error)
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 400 })
  }
}
