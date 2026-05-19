/**
 * GET /api/vendors/:vendor_id
 * 
 * Retorna los datos públicos de un vendedor específico.
 * 
 * Características:
 * - Autenticación via API key
 * - Retorna solo datos públicos
 * - Valida que el vendedor exista (404 si no existe)
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'

import { toPublicVendor } from '@/lib/vendors'
import type { VendorDetailResponse, ErrorResponse } from '@/lib/vendors'

interface RouteParams {
  params: Promise<{
    vendor_id: string
  }>
}

/**
 * GET /api/vendors/:vendor_id
 * 
 * Retorna un vendedor específico con sus datos públicos.
 * 
 * Path Parameters:
 * - vendor_id: ID del vendedor
 * 
 * Headers:
 * - X-API-Key (requerido): API key compartida
 * 
 * Responses:
 * - 200: Vendedor encontrado
 * - 404: Vendedor no existe
 * - 401: API key inválida
 */
export async function GET(
  request: Request,
  { params }: RouteParams
): Promise<Response> {
  try {
    // 1. Validar autenticación
    const vendorApiKey = process.env.VENDOR_API_KEY
    if (!validateApiKey(request, vendorApiKey)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'X-API-Key inválida o faltante' },
        { status: 401 }
      )
    }

    // 2. Validar que vendor_id sea válido (no vacío)
    const { vendor_id } = await params
    const vendorId = vendor_id.trim()
    if (!vendorId) {
      return NextResponse.json<ErrorResponse>(
        { error: 'ID de vendedor inválido' },
        { status: 400 }
      )
    }

    // 3. Buscar vendedor por ID
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    })

    // 4. Si no existe, retornar 404
    if (!vendor) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Vendedor no encontrado' },
        { status: 404 }
      )
    }

    // 5. Retornar datos públicos
    return NextResponse.json<VendorDetailResponse>(
      {
        success: true,
        vendor: toPublicVendor(vendor),
        
      },
      
      { status: 200 }
    )
  } catch (error) {
    console.error('Error en GET /api/vendors/:vendor_id:', error)
    return NextResponse.json<ErrorResponse>(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
