import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import { validateProductInput } from '@/lib/validation'
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
    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { vendor: { select: { id: true, name: true } } },
    })

    if (!product) {
      return NextResponse.json<ErrorResponse>({ error: 'Producto no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, product }, { status: 200 })
  } catch (error) {
    console.error('Error en GET /api/admin/products/[id]:', error)
    return NextResponse.json<ErrorResponse>({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const cpApiKey = process.env.CONTROL_PLANE_API_KEY
    if (!validateApiKey(request, cpApiKey)) {
      return NextResponse.json<ErrorResponse>({ error: 'X-API-Key inválida o faltante' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } })
    if (!existing) {
      return NextResponse.json<ErrorResponse>({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const data = validateProductInput(body)

    const product = await prisma.product.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, product }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('Error en PUT /api/admin/products/[id]:', error)
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const cpApiKey = process.env.CONTROL_PLANE_API_KEY
    if (!validateApiKey(request, cpApiKey)) {
      return NextResponse.json<ErrorResponse>({ error: 'X-API-Key inválida o faltante' }, { status: 401 })
    }

    const { id } = await params
    const product = await prisma.product.findFirst({ where: { id, deletedAt: null } })
    if (!product) {
      return NextResponse.json<ErrorResponse>({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true, product: updated }, { status: 200 })
  } catch (error) {
    console.error('Error en DELETE /api/admin/products/[id]:', error)
    return NextResponse.json<ErrorResponse>({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
