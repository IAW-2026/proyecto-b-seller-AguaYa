# Implementación: Endpoints Públicos de Vendedores

**Fecha:** Mayo 12, 2026  
**Estado:** Diseño + Implementación  
**Propósito:** Permitir que BuyerApp, FeedbackApp y DeliveryApp consulten datos públicos de vendedores de forma segura y eficiente.

---

## 1. Resumen Ejecutivo

Este documento describe la implementación de 3 endpoints REST públicos que exponen vendedores:

- `GET /api/vendors` — Lista todos los vendedores (datos públicos).
- `GET /api/vendors/:vendor_id` — Obtiene un vendedor específico.
- `GET /api/vendors?ids=id1,id2,id3` — Obtiene múltiples vendedores por IDs (favoritos).

El sistema garantiza:

- ✅ **Autenticación simple:** API key compartida entre apps (header `X-API-Key`).
- ✅ **Datos públicos solo:** Proyección que excluye CUIL, CUIT, userId, timestamps internos.
- ✅ **Validación rigurosa:** IDs válidos, parámetros bien formados.
- ✅ **Manejo de errores:** Códigos HTTP estándar (200, 400, 401, 404, 500).
- ✅ **Escalabilidad MVP:** Sin paginación ni filtros avanzados (fácil agregar después).

**Tiempo estimado de implementación:** ~8-12 horas (incluye schema, endpoints, tests, documentación).

---

## 2. Decisiones de Diseño y Justificaciones

### 2.1 Autenticación: API Key Compartida

**Decisión:** Usar header `X-API-Key` igual a `/api/orders`.

**Justificación:**
- ✅ **Consistencia:** Mismo patrón que endpoints de pedidos → menor curva de aprendizaje.
- ✅ **Seguridad:** Protege contra acceso no autorizado desde apps externas.
- ✅ **Simplicidad:** No requiere infraestructura de tokens complejos.
- ✅ **MVP-friendly:** Fácil de testear en desarrollo y producción.

**Configuración:**
- Variable de entorno: `VENDOR_API_KEY` (usar valor igual a `BUYER_API_KEY` por simplicidad).
- Header esperado: `X-API-Key: ${VENDOR_API_KEY}`.
- Validación: rechazar con `401` si header falta o es incorrecto.

**Alternativas consideradas:**
- Sin autenticación: riesgoso, expone datos a cualquier cliente.
- JWT firmado: más complejo, requiere infraestructura de claves.
- OAuth 2.0: excesivo para MVP.

---

### 2.2 Proyección de Datos Públicos

**Decisión:** Exponer solo: `id`, `name`, `description`, `reputation`, `address`, `image`.

**Justificación:**
- ✅ **Privacidad:** Campos sensibles (CUIL, CUIT, userId) NO se exponen.
- ✅ **Seguridad:** Reduce superficie de ataque y riesgo de exposición de datos.
- ✅ **Usabilidad:** BuyerApp tiene los datos necesarios para listar/buscar/mostrar vendedores.
- ✅ **Consistencia:** Alineado con documentación en `03-apis.md`.

**Campos excluidos:**
- `userId` (identidad interna de sistema de usuarios).
- `cuil`, `cuit` (datos fiscales privados).
- `createdAt`, `updatedAt` (timestamps internos).

**Implementación:**
- Función `toPublicVendor()` en `src/lib/vendors.ts` proyecta Vendor a PublicVendor.
- Nunca retornar objeto Prisma directamente; siempre pasar por proyección.
- Type-safe: interfaz `PublicVendor` asegura que no hay typos en campos.

**Alternativas consideradas:**
- Exponer todo (inseguro).
- Usar GraphQL con control de campos (sobrecomplejo para MVP).

---

### 2.3 Campo `image` Agregado al Modelo Vendor

**Decisión:** Migración Prisma agrega `image String?` al modelo `Vendor`.

**Justificación:**
- ✅ **Branding visual:** Permite que BuyerApp muestre logo/banner del vendedor.
- ✅ **Futuro-proof:** Alineado con Product que ya tiene imagen.
- ✅ **UX mejorada:** Interfaz visual más atractiva en catálogo.
- ✅ **Escalable:** Campo opcional (nullable) no requiere valor inicial.

**Migración:**
- Comando: `npx prisma db push --config prisma/prisma.config.ts`
- Efecto: Agrega columna `image VARCHAR(255) NULL` a tabla `vendor`.
- Rollback: Si fuera necesario, revertir schema.prisma y ejecutar `db push` nuevamente.

**Alternativas consideradas:**
- Usar imagen del primer producto: más complejo, menos flexible.
- Omitir imagen: funciona pero limita UX.

---

### 2.4 Sin Paginación (MVP)

**Decisión:** Retornar todos los vendedores en una sola respuesta (sin limit/offset).

**Justificación:**
- ✅ **Simplicidad MVP:** Pocos vendedores esperados en MVP (~5-20).
- ✅ **Rápido:** Query simple, sin complejidad de offset/cursor.
- ✅ **Fácil de escalar:** Agregar paginación es trivial después.
- ⚠️ **Limitación:** Si crecen vendedores a 1000+, agregar limit/offset.

**Escalabilidad futura:**
```
GET /api/vendors?limit=20&offset=0
GET /api/vendors?limit=20&page=2
```

---

### 2.5 Sin Filtros Avanzados (MVP)

**Decisión:** Endpoints retornan todos los vendedores; no hay filtrado por estado, reputación, etc.

**Justificación:**
- ✅ **Simplicidad:** No hay lógica de negocio de "vendedor activo/inactivo" aún.
- ✅ **Rápido de implementar:** 0 lógica condicional.
- ✅ **Flexible:** BuyerApp puede filtrar en su lado si lo necesita.
- ✅ **Escalable:** Fácil agregar `status` field y filtros después.

**Escalabilidad futura:**
- Agregar campo `status` (ACTIVE, INACTIVE, SUSPENDED).
- Agregar endpoint `GET /api/vendors?status=ACTIVE`.
- Agregar búsqueda: `GET /api/vendors/search?q=nombre`.

---

### 2.6 Manejo de Errores: HTTP Estándar

**Decisión:** Usar códigos HTTP estándar + mensajes de error descriptivos.

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| **200** | OK | Respuesta exitosa (vendedor/s encontrado/s). |
| **400** | Bad Request | IDs mal formados, parámetros inválidos. |
| **401** | Unauthorized | API key faltante o incorrecta. |
| **404** | Not Found | Vendedor específico no existe. |
| **500** | Internal Server Error | Error inesperado en servidor. |

**Justificación:**
- ✅ **Estándar REST:** Clientes pueden manejar errores de forma predecible.
- ✅ **Debugging fácil:** Mensaje de error claro en JSON.
- ✅ **Seguridad:** No expone stack traces al cliente.

---

## 3. Especificación Técnica

### 3.1 Endpoint 1: Listar Todos los Vendedores

```http
GET /api/vendors
Content-Type: application/json
X-API-Key: ${VENDOR_API_KEY}
```

**Respuesta 200 OK:**
```json
{
  "success": true,
  "vendors": [
    {
      "id": "vendor-1",
      "name": "AguaYa Zona Centro",
      "description": "Distribuidor de agua purificada y bebidas",
      "reputation": 4.8,
      "address": "Av. Corrientes 1234, CABA",
      "image": "https://cdn.example.com/vendor-1.jpg"
    },
    {
      "id": "vendor-2",
      "name": "AguaYa Zona Sur",
      "description": "Entregas rápidas en zona sur",
      "reputation": 4.5,
      "address": "Av. Acoyte 5678, CABA",
      "image": "https://cdn.example.com/vendor-2.jpg"
    }
  ]
}
```

**Respuesta 401 Unauthorized:**
```json
{
  "error": "X-API-Key inválida o faltante"
}
```

**Respuesta 500 Internal Server Error:**
```json
{
  "error": "Error interno del servidor"
}
```

---

### 3.2 Endpoint 2: Obtener Vendedor por ID

```http
GET /api/vendors/:vendor_id
Content-Type: application/json
X-API-Key: ${VENDOR_API_KEY}
```

**Parámetros:**
- `vendor_id` (path): ID único del vendedor.

**Aclaración de diseño:** este endpoint es el canónico para un vendedor individual. El endpoint `GET /api/vendors?ids=...` cubre el caso batch para múltiples vendedores y favoritos; no se usa como reemplazo del detalle por ID, sino como complemento cuando hay más de un vendedor a resolver en una misma llamada.

**Respuesta 200 OK:**
```json
{
  "success": true,
  "vendor": {
    "id": "vendor-1",
    "name": "AguaYa Zona Centro",
    "description": "Distribuidor de agua purificada y bebidas",
    "reputation": 4.8,
    "address": "Av. Corrientes 1234, CABA",
    "image": "https://cdn.example.com/vendor-1.jpg"
  }
}
```

**Respuesta 404 Not Found:**
```json
{
  "error": "Vendedor no encontrado"
}
```

**Respuesta 401 Unauthorized:**
```json
{
  "error": "X-API-Key inválida o faltante"
}
```

---

### 3.3 Endpoint 3: Listar Vendedores por IDs (Favoritos)

```http
GET /api/vendors?ids=vendor-1,vendor-2,vendor-3
Content-Type: application/json
X-API-Key: ${VENDOR_API_KEY}
```

**Parámetros Query:**
- `ids` (string, obligatorio si se usa): IDs separados por comas (sin espacios).

**Respuesta 200 OK:**
```json
{
  "success": true,
  "vendors": [
    {
      "id": "vendor-1",
      "name": "AguaYa Zona Centro",
      ...
    },
    {
      "id": "vendor-2",
      "name": "AguaYa Zona Sur",
      ...
    }
  ]
}
```

**Respuesta 400 Bad Request (IDs inválidos):**
```json
{
  "error": "Parámetro 'ids' no puede estar vacío. Usar: ?ids=id1,id2,id3"
}
```

**Respuesta 401 Unauthorized:**
```json
{
  "error": "X-API-Key inválida o faltante"
}
```

---

## 4. Estructura de Archivos Creados/Modificados

### Crear

```
src/
  ├── lib/
  │   ├── auth.ts                          [NUEVO] Validación API key reutilizable
  │   ├── vendors.ts                       [NUEVO] Proyección de datos públicos
  │   └── validation.ts                    [MODIFICADO] Agregar validateVendorIds()
  │
  └── app/api/vendors/
      ├── route.ts                         [NUEVO] GET /api/vendors + ?ids=...
      └── [vendor_id]/
          └── route.ts                     [NUEVO] GET /api/vendors/:vendor_id

prisma/
  └── schema.prisma                        [MODIFICADO] Agregar field image a Vendor

scripts/
  └── test-vendors.ts                      [NUEVO] Tests unitarios en TypeScript

tests-vendors.sh                           [NUEVO] Script de tests manuales con curl

implementacion-ia/
  └── IMPLEMENTACION_VENDEDORES.md         [NUEVO] Este documento

ESTADO.md                                  [MODIFICADO] Marcar vendedores como completados
AGENTS.md                                  [MODIFICADO] Marcar endpoints como ✅ Implementados
```

### Modificar

- `prisma/schema.prisma` — Agregar `image String?` al modelo `Vendor`.
- `prisma/prisma.config.ts` — Actualizar rutas a path.resolve() para compatibilidad con Prisma 7.x.
- `src/lib/validation.ts` — Agregar función `validateVendorIds()`.
- `AGENTS.md` — Marcar endpoints como completados.
- `implementacion-ia/ESTADO.md` — Registrar nueva fase completada.

---

## 5. Decisiones Técnicas Importantes

### 5.1 API Key Reutilizable

Se creó función `validateApiKey()` en `src/lib/auth.ts` para reutilizar en múltiples endpoints.

```typescript
export function validateApiKey(request: Request, expectedKey: string | undefined): boolean {
  const apiKey = request.headers.get('X-API-Key')
  if (!expectedKey) {
    console.error('API_KEY no configurada en variables de entorno')
    return false
  }
  return apiKey === expectedKey
}
```

**Ventaja:** Mismo patrón se puede usar en `/api/products`, `/api/orders`, etc.

---

### 5.2 Proyección Type-Safe

Las funciones de proyección tienen tipos explícitos:

```typescript
export function toPublicVendor(vendor: Vendor): PublicVendor {
  return {
    id: vendor.id,
    name: vendor.name,
    description: vendor.description,
    reputation: vendor.reputation,
    address: vendor.address,
    image: vendor.image,
  }
}
```

**Ventaja:** TypeScript garantiza que no olvidamos campos públicos y no incluimos privados.

---

### 5.3 Validación de IDs Flexible

La función `validateVendorIds()` es robusta:

```typescript
export function validateVendorIds(idsString: string | null | undefined): string[] {
  // - Rechaza null/undefined
  // - Rechaza strings vacíos
  // - Parsea "id1,id2,id3"
  // - Filtra espacios en blanco
  // - Valida que haya al menos un ID
  // - Lanza error con mensaje descriptivo
}
```

---

### 5.4 Migraciones de Prisma 7.x

Prisma 7.x requiere que la URL de BD esté en `prisma.config.ts`, no en `schema.prisma`.

```typescript
// prisma/prisma.config.ts
export default {
  schema: path.resolve(__dirname, "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
}
```

Comando: `npx prisma db push --config prisma/prisma.config.ts`

---

## 6. Testing

### 6.1 Tests Unitarios (TypeScript)

```bash
npx ts-node scripts/test-vendors.ts
```

Valida:
- ✅ Parsing de IDs (múltiples, vacíos, null).
- ✅ Proyección de datos públicos.
- ✅ Excusión de datos privados.
- ✅ Conversión de arrays.

### 6.2 Tests Manuales (Bash + curl)

```bash
bash tests-vendors.sh
```

Valida:
- ✅ GET /api/vendors sin API key → 401.
- ✅ GET /api/vendors con API key → 200.
- ✅ GET /api/vendors?ids=... → 200.
- ✅ GET /api/vendors?ids= (vacío) → 400.
- ✅ GET /api/vendors/:vendor_id → 200 o 404.

### 6.3 Validación de Datos

Después de implementar, verificar manualmente:

```bash
curl -H "X-API-Key: buyer-secret-key-12345" \
  http://localhost:3000/api/vendors | jq '.vendors[0]'
```

Confirmar que respuesta:
- ✅ Incluye: id, name, description, reputation, address, image.
- ✅ Excluye: userId, cuil, cuit, createdAt, updatedAt.

---

## 7. Cronograma Realizado

| Fase | Descripción | Tiempo | Estado |
|------|------------|--------|--------|
| 1 | Schema: Agregar `image` a Vendor | 1-2h | ✅ Completado |
| 2 | Validadores: `validateVendorIds()`, `validateApiKey()` | 1-2h | ✅ Completado |
| 3 | Proyección: `toPublicVendor()` en `lib/vendors.ts` | 30m | ✅ Completado |
| 4 | Endpoints: `route.ts` para GET /api/vendors* | 2-3h | ✅ Completado |
| 5 | Tests: unitarios + script manual | 1-2h | ✅ Completado |
| 6 | Documentación: este documento + ESTADO.md | 1h | ✅ Completado |
| **Total** | | **~8-12h** | **✅ Completado** |

---

## 8. Consideraciones Futuras

### 8.1 Paginación

Si crece a 1000+ vendedores:

```http
GET /api/vendors?limit=20&offset=0
```

Implementar con Prisma:

```typescript
const vendors = await prisma.vendor.findMany({
  take: limit,
  skip: offset,
  orderBy: { createdAt: 'desc' },
})
```

### 8.2 Búsqueda Full-Text

Agregar endpoint:

```http
GET /api/vendors/search?q=agua
```

Usar búsqueda ilike en Postgres:

```typescript
where: {
  name: { ilike: `%${q}%` }
}
```

### 8.3 Filtrado por Status

Agregar campo `status` (ACTIVE, INACTIVE) a Vendor y filtrar:

```http
GET /api/vendors?status=ACTIVE
```

### 8.4 Caché

Implementar Redis para GETs (datos poco mutables):

```typescript
const cached = await redis.get(`vendors:all`)
if (cached) return JSON.parse(cached)
// ...
await redis.set(`vendors:all`, JSON.stringify(vendors), 'EX', 3600)
```

### 8.5 Rate Limiting

Proteger endpoints públicos contra abuso:

```typescript
const rateLimit = await checkRateLimit(apiKey)
if (rateLimit.exceeded) return 429
```

---

## 9. Resumen

La implementación de endpoints de vendedores sigue el mismo patrón que `/api/orders`:

1. **Autenticación** por API key (reutilizable).
2. **Validación rigurosa** de parámetros.
3. **Proyección** de datos públicos (type-safe).
4. **Manejo de errores** con códigos HTTP estándar.
5. **Tests** unitarios + manuales.
6. **Documentación** clara y completa.

Los endpoints están listos para ser consumidos por BuyerApp, FeedbackApp y DeliveryApp de forma segura, eficiente y escalable.

---

**Implementado por:** GitHub Copilot  
**Fecha:** Mayo 12, 2026  
**Próximas etapas:** Integración con BuyerApp, testing de E2E, puesta en producción.
