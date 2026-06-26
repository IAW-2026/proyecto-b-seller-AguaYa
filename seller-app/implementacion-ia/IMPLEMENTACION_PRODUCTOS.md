# Implementación: Endpoints Públicos de Productos

**Fecha:** Mayo 12, 2026  
**Estado:** Diseño + Implementación  
**Propósito:** Permitir que BuyerApp consulte productos de forma segura, con filtrado flexible y manejo de errores robusto.

---

## 1. Resumen Ejecutivo

Este documento describe la implementación de un endpoint REST público que expone productos:

- `GET /api/products` — Lista todos los productos (datos públicos).
- `GET /api/products?vendorId=id1,id2` — Filtra por uno o más vendedores.
- `GET /api/products?minPrice=X&maxPrice=Y` — Filtra por rango de precio.

El sistema garantiza:

- ✅ **Autenticación simple:** API key compartida entre apps (header `X-API-Key`).
- ✅ **Datos públicos solo:** Proyección que excluye timestamps internos.
- ✅ **Filtrado flexible:** Combinable por vendorId, minPrice, maxPrice.
- ✅ **Validación rigurosa:** Parámetros bien formados, lógica consistente.
- ✅ **Manejo de errores:** Códigos HTTP estándar (200, 400, 401, 500).
- ✅ **Escalabilidad MVP:** Sin paginación aún (fácil agregar después).

**Tiempo estimado de implementación:** ~4-6 horas (schema análisis, endpoint, tests, validaciones).

---

## 2. Decisiones de Diseño y Justificaciones

### 2.1 Autenticación: API Key Compartida

**Decisión:** Usar header `X-API-Key` idéntico a `/api/vendors` y `/api/orders`.

**Justificación:**
- ✅ **Consistencia:** Mismo patrón en todos los endpoints inter-servicios → fácil de implementar en BuyerApp.
- ✅ **Seguridad:** Protege contra acceso no autorizado desde apps externas.
- ✅ **MVP-friendly:** Sin infraestructura compleja de OAuth/JWT para consultas públicas.
- ✅ **Reutilizable:** BuyerApp ya tiene la lógica de envío de headers.

**Configuración:**
- Variable de entorno: `VENDOR_API_KEY` (reutiliza la de vendedores).
- Header esperado: `X-API-Key: ${VENDOR_API_KEY}`.
- Validación: rechazar con `401` si header falta o es incorrecto.

**Alternativas consideradas:**
- Sin autenticación: riesgoso, expone datos a cualquier cliente.
- JWT: más seguro pero requiere infraestructura de keys por cliente.

---

### 2.2 Proyección de Datos Públicos

**Decisión:** Exponer solo: `id`, `vendorId`, `name`, `description`, `price`, `stock`, `image`.

**Justificación:**
- ✅ **Privacidad:** No expone datos internos (createdAt, updatedAt).
- ✅ **Usabilidad:** BuyerApp tiene exactamente los datos necesarios para mostrar catálogo.
- ✅ **Stock Real:** Incluir `stock` permite validación en BuyerApp antes de crear orden.
- ✅ **Visibilidad:** vendorId permite agrupar/filtrar por vendor en UI.
- ✅ **Consistencia:** Similar a Vendor (id, name, description, address, image).

**Campos incluidos:**
- `id`, `vendorId`, `name`, `description`, `price`, `stock`, `image`.

**Campos excluidos:**
- `createdAt`, `updatedAt` (timestamps internos, no relevantes para buyer).
- Información fiscal o privada del vendor (ya separado en Vendor schema).

**Implementación:**
- Función `toPublicProduct()` en `src/lib/products.ts` proyecta Product a PublicProduct.
- Nunca retornar objeto Prisma directamente; siempre pasar por proyección.
- Type-safe: interfaz `PublicProduct` asegura que no hay typos.

**Alternativas consideradas:**
- Exponer todo (inseguro, fuga de datos internos).
- GraphQL: sobrecomplejo para MVP.

---

### 2.3 Filtrado Flexible: Query Parameters

**Decisión:** Endpoint único `GET /api/products` con parámetros opcionales query.

**Justificación:**
- ✅ **Flexibilidad:** Combinable (vendorId + precio + futuros filtros).
- ✅ **Consistencia:** Alineado con `GET /api/vendors?ids=...`.
- ✅ **REST-compliant:** Query params para filtrado, no headers.
- ✅ **Escalabilidad:** Fácil agregar más filtros sin nuevo endpoint.

**Parámetros actuales:**

| Parámetro | Tipo | Ejemplo | Validación |
|-----------|------|---------|-----------|
| `vendorId` | string (comas) | `ven-1,ven-2` | Validar cada ID no vacío |
| `minPrice` | float | `10.50` | >= 0, <= maxPrice |
| `maxPrice` | float | `100.00` | >= 0, >= minPrice |

**Ejemplos de uso:**
```http
GET /api/products
GET /api/products?vendorId=ven-1
GET /api/products?vendorId=ven-1,ven-2
GET /api/products?minPrice=10&maxPrice=100
GET /api/products?vendorId=ven-1&minPrice=20&maxPrice=50
```

**Escalabilidad futura:**
- `search` (búsqueda por nombre/descripción).
- `inStock` (solo productos con stock > 0).
- `sortBy` (ordenamiento: price, name, stock).
- Paginación (`limit`, `offset`).

**Alternativas consideradas:**
- Endpoints separados (`/api/vendors/:id/products`): menos flexible, más endpoints.
- POST con body de filtros: no es REST-compliant para queries.

---

### 2.4 Validación de Filtros

**Decisión:** Validar parámetros antes de query BD + rechazar combinaciones inválidas.

**Justificación:**
- ✅ **Seguridad:** Evitar inyecciones SQL (Prisma maneja, pero validar siempre).
- ✅ **Debugging:** Mensajes claros si cliente envía parámetros malformados.
- ✅ **Consistencia:** Error 400 para bad requests, no 500 sorpresas.
- ✅ **UX:** BuyerApp sabe exactamente qué corregir.

**Validaciones aplicadas:**
- vendorId: string no vacío, IDs separados por comas, cada ID trimmed.
- minPrice: float >= 0.
- maxPrice: float >= 0.
- Lógica: minPrice <= maxPrice (rechazar combinaciones ilógicas).
- Cualquier error en validación → `400 Bad Request`.

**Implementación:**
- Función `validateProductFilters()` en `src/lib/validation.ts`.
- Reutiliza `validateVendorIds()` para parsing de IDs.
- Retorna objeto `ProductFilterParams` type-safe.

---

### 2.5 Ordenamiento de Resultados

**Decisión:** Retornar ordenado por (1) vendorId, (2) price, (3) name.

**Justificación:**
- ✅ **UX:** Agrupa por vendor → más intuitivo en UI (dropdown de vendors).
- ✅ **Determinista:** Mismo orden en cada request (importante para pagination futura).
- ✅ **Performance:** Índices en BD facilitan esta combinación.
- ✅ **Escalable:** Fácil cambiar con parámetro `sortBy` futuro.

**Orden actual:**
```prisma
orderBy: [
  { vendorId: 'asc' },  // Agrupar por vendor
  { price: 'asc' },      // Ordenar barato a caro dentro vendor
  { name: 'asc' },       // Ordenar alfabético si mismo precio
]
```

**Alternativas consideradas:**
- Sin ordenamiento: inconsistente, confuso para UI.
- Ordenar por precio global: dificulta agrupar por vendor.

---

### 2.6 Sin Paginación (MVP)

**Decisión:** Retornar todos los productos que matcheen filtros en una sola respuesta.

**Justificación:**
- ✅ **Simplicidad MVP:** Productos esperados ~50-500 en MVP (~100 por vendor × 5 vendors).
- ✅ **Rápido:** Query simple, sin complejidad de offset/cursor.
- ✅ **Fácil de escalar:** Agregar paginación es trivial después.
- ⚠️ **Limitación:** Si crecen a 10K+ productos, agregar limit/offset.

**Escalabilidad futura:**
```http
GET /api/products?vendorId=ven-1&limit=20&offset=0
GET /api/products?vendorId=ven-1&limit=20&page=2
```

---

### 2.7 Manejo de Errores: HTTP Estándar

**Decisión:** Usar códigos HTTP estándar + mensajes descriptivos.

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| **200** | OK | Respuesta exitosa (productos encontrados o lista vacía si ninguno matchea). |
| **400** | Bad Request | vendorId mal formado, precio inválido, minPrice > maxPrice. |
| **401** | Unauthorized | API key faltante o incorrecta. |
| **500** | Internal Server Error | Error inesperado en servidor. |

**Justificación:**
- ✅ **Estándar REST:** Cliente maneja errores de forma predecible.
- ✅ **Debugging fácil:** Mensaje claro en JSON → No necesita logs complejos.
- ✅ **Seguridad:** No expone stack traces al cliente.

**Notas:**
- No usar 404 si no hay resultados: retornar 200 con array vacío (es correcto si filtros son válidos).
- No usar 500 para bad params: es 400 (Bad Request).

---

## 3. Especificación Técnica

### 3.1 Endpoint: GET /api/products

```http
GET /api/products
Content-Type: application/json
X-API-Key: ${VENDOR_API_KEY}
```

**Query Parameters (todos opcionales):**
- `vendorId` (string): IDs separados por comas. Ej: `?vendorId=vendor-1,vendor-2`.
- `minPrice` (number): Precio mínimo. Ej: `?minPrice=10.50`.
- `maxPrice` (number): Precio máximo. Ej: `?maxPrice=100.00`.

**Ejemplos:**
```http
GET /api/products
GET /api/products?vendorId=ven-1
GET /api/products?vendorId=ven-1&minPrice=20&maxPrice=100
```

### 3.2 Respuestas

**200 OK (con productos):**
```json
{
  "success": true,
  "products": [
    {
      "id": "prod-1",
      "vendorId": "vendor-1",
      "name": "Agua Purificada 20L",
      "description": "Bidón de agua purificada de 20 litros",
      "price": 45.50,
      "stock": 150,
      "image": "https://cdn.example.com/prod-1.jpg"
    },
    {
      "id": "prod-2",
      "vendorId": "vendor-1",
      "name": "Agua Mineral 20L",
      "description": "Bidón de agua mineral con electrolitos",
      "price": 65.00,
      "stock": 200,
      "image": "https://cdn.example.com/prod-2.jpg"
    }
  ]
}
```

**200 OK (sin productos, filtros válidos pero no hay matches):**
```json
{
  "success": true,
  "products": []
}
```

**400 Bad Request (parámetro inválido):**
```json
{
  "error": "minPrice debe ser un número >= 0"
}
```

```json
{
  "error": "minPrice no puede ser mayor que maxPrice"
}
```

**401 Unauthorized (API key faltante/incorrecta):**
```json
{
  "error": "X-API-Key inválida o faltante"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Error interno del servidor"
}
```

---

## 4. Estructura de Archivos Creados/Modificados

### Creados

```
src/
├── lib/
│   └── products.ts                      # Utilidades: toPublicProduct(), interfaces
├── app/api/
│   └── products/
│       └── route.ts                     # GET /api/products endpoint
└── api-tests/
    └── test_products.http               # Casos de prueba REST Client
```

### Modificados

```
src/
└── lib/
    └── validation.ts                    # Agregado: validateProductFilters()
```

---

## 5. Flujo de Ejecución

### 5.1 Request Recibido

```
GET /api/products?vendorId=ven-1&minPrice=20&maxPrice=100
X-API-Key: buyer-secret-key-12345
```

### 5.2 Pasos en route.ts

1. **Validar autenticación:** Verificar header `X-API-Key` contra `VENDOR_API_KEY`.
   - Si falta o es incorrecta → `401 Unauthorized`.

2. **Parsear query params:** Extraer `vendorId`, `minPrice`, `maxPrice`.
   - Usar `searchParams` de URL.

3. **Validar filtros:** Ejecutar `validateProductFilters()`.
   - Pasar solo parámetros presentes (no undefined).
   - Si hay error → `400 Bad Request`.

4. **Construir WHERE Prisma dinámicamente:**
   ```javascript
   const where = {};
   if (filters.vendorIds) where.vendorId = { in: filters.vendorIds };
   if (filters.minPrice) where.price = { ...where.price, gte: filters.minPrice };
   if (filters.maxPrice) where.price = { ...where.price, lte: filters.maxPrice };
   ```

5. **Query BD:**
   ```javascript
   const products = await prisma.product.findMany({
     where,
     orderBy: [
       { vendorId: 'asc' },
       { price: 'asc' },
       { name: 'asc' }
     ]
   });
   ```

6. **Proyectar datos:** `toPublicProducts(products)`.

7. **Retornar 200 OK.**

---

## 6. Casos de Prueba

Ver `api-tests/test_products.http` para 18 casos de prueba que cubren:

- Listar todos.
- Filtrar por vendorId (uno, múltiples, inexistente).
- Filtrar por precio (min, max, ambos, negativo, lógica invertida).
- Errores de autenticación (falta, incorrecta).
- Errores de validación (parámetros malformados).
- Combinaciones complejas.

---

## 7. Escalabilidad Futura

| Feature | Esfuerzo | Razón |
|---------|----------|-------|
| Paginación (limit/offset) | ⭐ Bajo | Agregar parámetros a WHERE y select. |
| Búsqueda por nombre (search) | ⭐ Bajo | Prisma `contains` o `startsWith`. |
| Filtro inStock | ⭐ Bajo | Agregar `stock: { gt: 0 }` a WHERE. |
| Ordenamiento dinámico (sortBy) | ⭐ Bajo | Parsear y aplicar orderBy dinámicamente. |
| Caché (Redis) | ⭐⭐ Medio | Para consultas frecuentes de "todos". |
| Búsqueda Full-Text | ⭐⭐⭐ Alto | Requiere índices en BD o ES. |

---

## 8. Testing Manual

Ejecutar en VS Code con REST Client (extensión instalada):

```bash
# Abrir archivo de tests
code api-tests/test_products.http

# Ejecutar cada test con "Send Request"
# Ver respuestas en pestaña al lado
```

Alternativamente con cURL:

```bash
curl -X GET "http://localhost:3000/api/products?vendorId=ven-1&minPrice=10&maxPrice=100" \
  -H "X-API-Key: buyer-secret-key-12345" \
  -H "Content-Type: application/json"
```

---

## 9. Notas de Implementación

- **Prisma Query:** Uso de `findMany()` con `where` dinámico es seguro contra SQL injection.
- **Type Safety:** Interfaces `PublicProduct`, `ProductsListResponse` previenen typos.
- **Logging:** Console.error en catch para debugging en producción.
- **Performance:** Sin `include` relacionales (solo proyección simple). O(N) en memoria post-query.

