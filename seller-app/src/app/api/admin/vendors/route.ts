import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import { validateVendorInput } from '@/lib/validation'
import { clerkClient } from '@clerk/nextjs/server'
import { ADMIN_PAGE_SIZE, CLERK_USERS_FETCH_LIMIT } from '@/lib/constants'
import { listAllVendors, listAllVendorsPaginated } from '@/lib/queries/vendors'
import type { ErrorResponse } from '@/lib/api-types'
import type { Vendor } from '@prisma/client'

type VendorListItem = Vendor & {
  clerkName: string
  clerkEmail: string
  _count: { products: number; orders: number }
}

type ListResponse = {
  items: VendorListItem[]
  total: number
  pageCount: number
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
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const q = searchParams.get('q') ?? undefined
    const sortBy = searchParams.get('sortBy') ?? undefined
    const sortOrder = searchParams.get('sortOrder') ?? undefined
    const isActiveParam = searchParams.get('isActive')
    const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined

    const client = await clerkClient()

    if (!q) {
      const dbResult = await listAllVendorsPaginated(page, {
        limit: ADMIN_PAGE_SIZE,
        sortBy,
        sortOrder,
        isActive,
      })

      const userIds = dbResult.items.map((v) => v.userId)
      const { data: clerkUsers } = await client.users.getUserList({
        userId: userIds,
        limit: userIds.length,
      })
      const clerkMap = new Map(clerkUsers.map((u) => [u.id, u]))

      const vendorCounts = await prisma.vendor.findMany({
        where: { id: { in: dbResult.items.map((v) => v.id) } },
        select: { id: true, _count: { select: { products: true, orders: true } } },
      })
      const countMap = new Map(vendorCounts.map((c) => [c.id, c._count]))

      const items = dbResult.items.map((v) => {
        const clerkUser = clerkMap.get(v.userId)
        return {
          ...v,
          clerkName: clerkUser
            ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || ''
            : '',
          clerkEmail: clerkUser?.emailAddresses?.[0]?.emailAddress || '',
          _count: countMap.get(v.id) ?? { products: 0, orders: 0 },
        } satisfies VendorListItem
      })

      return NextResponse.json<ListResponse>(
        { items, total: dbResult.total, pageCount: dbResult.pageCount },
        { status: 200 }
      )
    }

    const vendors = await listAllVendors(isActive)
    const { data: clerkUsers } = await client.users.getUserList({ limit: CLERK_USERS_FETCH_LIMIT })
    const clerkMap = new Map(clerkUsers.map((u) => [u.id, u]))

    const enriched = vendors.map((v) => {
      const clerkUser = clerkMap.get(v.userId)
      return {
        ...v,
        clerkName: clerkUser
          ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || ''
          : '',
        clerkEmail: clerkUser?.emailAddresses?.[0]?.emailAddress || '',
      }
    })

    const qLower = q.toLowerCase()
    const filtered = enriched.filter(
      (v) =>
        v.name.toLowerCase().includes(qLower) ||
        v.clerkEmail.toLowerCase().includes(qLower) ||
        v.clerkName.toLowerCase().includes(qLower) ||
        v.address.toLowerCase().includes(qLower) ||
        (v.cuil ?? '').toLowerCase().includes(qLower) ||
        (v.cuit ?? '').toLowerCase().includes(qLower)
    )

    const order = sortOrder === 'desc' ? -1 : 1
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name) * order)
    } else if (sortBy === 'isActive') {
      filtered.sort((a, b) => (Number(a.isActive) - Number(b.isActive)) * order)
    } else {
      filtered.sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * -order)
    }

    const total = filtered.length
    const limit = ADMIN_PAGE_SIZE
    const pageCount = Math.ceil(total / limit)
    const paginatedItems = filtered.slice((page - 1) * limit, page * limit)

    const counts = await prisma.vendor.findMany({
      where: { id: { in: paginatedItems.map((v) => v.id) } },
      select: { id: true, _count: { select: { products: true, orders: true } } },
    })
    const countMap = new Map(counts.map((c) => [c.id, c._count]))

    const items = paginatedItems.map((v) => ({
      ...v,
      _count: countMap.get(v.id) ?? { products: 0, orders: 0 },
    })) satisfies VendorListItem[]

    return NextResponse.json<ListResponse>({ items, total, pageCount }, { status: 200 })
  } catch (error) {
    console.error('Error en GET /api/admin/vendors:', error)
    return NextResponse.json<ErrorResponse>(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const cpApiKey = process.env.CONTROL_PLANE_API_KEY
    if (!validateApiKey(request, cpApiKey)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'X-API-Key inválida o faltante' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = validateVendorInput(body)

    const vendor = await prisma.vendor.create({
      data: {
        userId: body.userId ?? '',
        name: data.name,
        address: data.address,
        description: data.description,
        cuil: data.cuil,
        cuit: data.cuit,
        image: data.image,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, vendor }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('Error en POST /api/admin/vendors:', error)
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 400 })
  }
}
