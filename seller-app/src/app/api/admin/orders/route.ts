import { NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'
import { listAllOrdersPaginated } from '@/lib/queries/orders'
import type { ErrorResponse } from '@/lib/api-types'

export async function GET(request: Request) {
  try {
    const cpApiKey = process.env.CONTROL_PLANE_API_KEY
    if (!validateApiKey(request, cpApiKey)) {
      return NextResponse.json<ErrorResponse>({ error: 'X-API-Key inválida o faltante' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const q = searchParams.get('q') ?? undefined
    const status = searchParams.get('status') ?? undefined
    const from = searchParams.get('from') ?? undefined
    const to = searchParams.get('to') ?? undefined

    const result = await listAllOrdersPaginated(page, { q, status, from, to })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error en GET /api/admin/orders:', error)
    return NextResponse.json<ErrorResponse>({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
