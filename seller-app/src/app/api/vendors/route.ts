/**
 * GET /api/vendors
 * 
 * Expone la lista de vendedores para ser consumida por otras aplicaciones (BuyerApp, FeedbackApp, DeliveryApp).
 * 
 * Características:
 * - Autenticación via API key en header X-API-Key
 * - Retorna solo datos públicos (sin CUIL, CUIT, userId, timestamps internos)
 * - Soporta filtrado opcional por IDs con query parameter ?ids=id1,id2,id3
 * - Códigos HTTP estándar (200, 400, 401)
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import { validateVendorIds } from '@/lib/validation'
import { toPublicVendors } from '@/lib/vendors'
import type { VendorsListResponse, ErrorResponse } from '@/lib/vendors'

/**
 * GET /api/vendors
 * 
 * Retorna lista de vendedores públicos. Puede ser filtrada por IDs.
 * 
 * Query Parameters:
 * - ids (opcional): IDs separados por comas. Ej: ?ids=vendor-1,vendor-2,vendor-3
 * 
 * Headers:
 * - X-API-Key (requerido): API key compartida entre aplicaciones
 * 
 * Responses:
 * - 200: Lista de vendedores (todos o filtrados)
 * - 400: Query params inválidos o mal formados
 * - 401: API key inválida o faltante
 */
export async function GET(request: Request): Promise<Response> {
  try {
    // 1. Validar autenticación
    const vendorApiKey = process.env.VENDOR_API_KEY
    if (!validateApiKey(request, vendorApiKey)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'X-API-Key inválida o faltante' },
        { status: 401 }
      )
    }

    // 2. Parsear URL y obtener query parameters
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    // 3. Si hay filtro de IDs, validar y buscar solo esos vendors
    if (idsParam) {
      try {
        const validIds = validateVendorIds(idsParam)
        
        const vendors = await prisma.vendor.findMany({
          where: {
            id: {
              in: validIds,
            },
            deletedAt: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return NextResponse.json<VendorsListResponse>(
          {
            success: true,
            vendors: toPublicVendors(vendors),
          },
          {
            status: 200,
            headers: {
              'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
            },
          }
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Validación de IDs fallida'
        return NextResponse.json<ErrorResponse>(
          { error: message },
          { status: 400 }
        )
      }
    }

    // 4. Si no hay filtro, retornar todos los vendedores
    const allVendors = await prisma.vendor.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json<VendorsListResponse>(
      {
        success: true,
        vendors: toPublicVendors(allVendors),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (error) {
    console.error('Error en GET /api/vendors:', error)
    return NextResponse.json<ErrorResponse>(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
