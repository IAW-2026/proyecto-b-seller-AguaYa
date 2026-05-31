import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'

import { validateProductFilters } from '@/lib/validation'
import { toPublicProducts } from '@/lib/products'
import type { Prisma } from '@prisma/client'
import type { ProductsListResponse, ErrorResponse } from '@/lib/products'

/**
 * GET /api/products
 * 
 * Retorna lista de productos públicos. Puede ser filtrada por vendorId, minPrice, maxPrice.
 * 
 * Query Parameters (todos opcionales):
 * - vendorId: IDs de vendedores separados por comas. Ej: ?vendorId=vendor-1,vendor-2
 * - minPrice: Precio mínimo. Ej: ?minPrice=10.50
 * - maxPrice: Precio máximo. Ej: ?maxPrice=100.00
 * 
 * Headers:
 * - X-API-Key (requerido): API key compartida entre aplicaciones
 * 
 * Ejemplos:
 * - GET /api/products → Todos los productos
 * - GET /api/products?vendorId=vendor-1 → Productos del vendor-1
 * - GET /api/products?minPrice=10&maxPrice=100 → Productos entre $10 y $100
 * - GET /api/products?vendorId=vendor-1&minPrice=20&maxPrice=50 → Combinación de filtros
 * 
 * Responses:
 * - 200: Lista de productos (todos o filtrados)
 * - 400: Query params inválidos o mal formados
 * - 401: API key inválida o faltante
 */
export async function GET(request: Request): Promise<Response> {
  try {
    // 1. Validar autenticación
    const productApiKey = process.env.VENDOR_API_KEY
    if (!validateApiKey(request, productApiKey)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'X-API-Key inválida o faltante' },
        { status: 401 }
      )
    }

    // 2. Parsear URL y obtener query parameters
    const { searchParams } = new URL(request.url)
    const vendorIdParam = searchParams.get('vendorId')
    const minPriceParam = searchParams.get('minPrice')
    const maxPriceParam = searchParams.get('maxPrice')

    // 3. Validar parámetros
    let filters
    try {
      filters = validateProductFilters({
        vendorId: vendorIdParam,
        minPrice: minPriceParam,
        maxPrice: maxPriceParam,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Validación de filtros fallida'
      return NextResponse.json<ErrorResponse>(
        { error: message },
        { status: 400 }
      )
    }

    // 4. Construir condiciones WHERE dinámicamente
    const where: Prisma.ProductWhereInput = {
      deletedAt: null, // Excluir productos soft-deleted
      isActive: true,  // Solo productos activos
    }

    if (filters.vendorIds && filters.vendorIds.length > 0) {
      where.vendorId = {
        in: filters.vendorIds,
      }
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {}
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice
      }
    }

    // 5. Ejecutar query
    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { vendorId: 'asc' },  // Agrupar por vendor
        { price: 'asc' },      // Ordenar por precio
        { name: 'asc' },       // Ordenar por nombre
      ],
    })

    // 6. Proyectar a datos públicos y retornar
    return NextResponse.json<ProductsListResponse>(
      {
        success: true,
        products: toPublicProducts(products),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
        },
      }
    )
  } catch (error) {
    console.error('Error en GET /api/products:', error)
    return NextResponse.json<ErrorResponse>(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
