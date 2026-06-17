import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import { validateVendorUpdateInput } from '@/lib/validation'
import { clerkClient } from '@clerk/nextjs/server'
import type { ErrorResponse } from '@/lib/api-types'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const cpApiKey = process.env.CONTROL_PLANE_API_KEY
    if (!validateApiKey(request, cpApiKey)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'X-API-Key inválida o faltante' },
        { status: 401 }
      )
    }

    const { id } = await params
    const vendor = await prisma.vendor.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { products: true, orders: true } } },
    })

    if (!vendor) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Vendedor no encontrado' },
        { status: 404 }
      )
    }

    const client = await clerkClient()
    let clerkName = ''
    let clerkEmail = ''
    try {
      const clerkUser = await client.users.getUser(vendor.userId)
      clerkName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || ''
      clerkEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || ''
    } catch {
    }

    return NextResponse.json({
      success: true,
      vendor: { ...vendor, clerkName, clerkEmail },
    }, { status: 200 })
  } catch (error) {
    console.error('Error en GET /api/admin/vendors/[id]:', error)
    return NextResponse.json<ErrorResponse>(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const cpApiKey = process.env.CONTROL_PLANE_API_KEY
    if (!validateApiKey(request, cpApiKey)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'X-API-Key inválida o faltante' },
        { status: 401 }
      )
    }

    const { id } = await params
    const existing = await prisma.vendor.findFirst({
      where: { id, deletedAt: null },
    })
    if (!existing) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Vendedor no encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    validateVendorUpdateInput(body)

    const updateData: Record<string, unknown> = {}
    for (const key of ['name', 'address', 'description', 'cuil', 'cuit', 'image']) {
      if (body[key] !== undefined) updateData[key] = body[key]
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, vendor }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('Error en PUT /api/admin/vendors/[id]:', error)
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const cpApiKey = process.env.CONTROL_PLANE_API_KEY
    if (!validateApiKey(request, cpApiKey)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'X-API-Key inválida o faltante' },
        { status: 401 }
      )
    }

    const { id } = await params
    const vendor = await prisma.vendor.findFirst({
      where: { id, deletedAt: null },
    })
    if (!vendor) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Vendedor no encontrado' },
        { status: 404 }
      )
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true, vendor: updated }, { status: 200 })
  } catch (error) {
    console.error('Error en DELETE /api/admin/vendors/[id]:', error)
    return NextResponse.json<ErrorResponse>(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
