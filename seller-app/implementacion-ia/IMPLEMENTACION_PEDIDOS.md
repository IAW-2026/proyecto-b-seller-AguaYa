# Implementación: Sistema de Recepción de Pedidos Entrantes

**Fecha:** Mayo 11, 2026  
**Estado:** Diseño + Implementación  
**Propósito:** Permitir que la Buyer App envíe pedidos a la Seller App de forma segura, confiable e idempotente.

---

## 1. Resumen Ejecutivo

Este documento describe la implementación de un endpoint seguro `POST /api/orders` que permite a la Buyer App enviar pedidos a la Seller App. El sistema garantiza:

- ✅ **Autenticación simple:** API key compartida entre apps.
- ✅ **Idempotencia:** campo `externalId` único previene duplicados.
- ✅ **Atomicidad:** transacción Prisma crea Order + OrderItems y actualiza stock.
- ✅ **Validación rigurosa:** verifica payload, stock, totales y permisos.
- ✅ **Manejo de concurrencia:** evita condiciones de carrera con restricción UNIQUE.

**Tiempo estimado de implementación:** ~2 horas (schema + handler + tests).

---

## 2. Decisiones de Diseño y Justificaciones

### 2.1 Autenticación: API Key Simple

**Decisión:** Usar un header `X-API-Key` compartido entre Buyer App y Seller App.

**Justificación:**
- ✅ Simplicidad: no requiere infraestructura de tokens JWT.
- ✅ MVP-friendly: fácil de configurar y probar en desarrollo.
- ✅ Suficiente para MVP: protege contra llamadas no autorizadas.
- ⚠️ Limitación: menos flexible que JWT para escalar a múltiples buyers o revocar dinámicamente.

**Alternativas consideradas:**
- JWT firmado: más robusto y escalable, pero requiere infraestructura de claves públicas/privadas.
- OAuth 2.0: demasiado complejo para MVP.

**Configuración:**
- Variable de entorno: `BUYER_API_KEY` (seller-app conoce la clave de buyer).
- Header esperado: `X-API-Key: ${BUYER_API_KEY}`.
- Validación: rechazar con `401` si header falta o es incorrecto.

---

### 2.2 Idempotencia: Campo `externalId` Único

**Decisión:** Añadir campo `externalId String? @unique` al modelo `Order`.

**Justificación:**
- ✅ Seguridad contra reintentos: si buyer reintenta POST (por timeout/error de red), seller devuelve la misma orden.
- ✅ Simple de auditar: cada orden tiene su ID externo visible.
- ✅ Previene duplicados: la BD garantiza unicidad con restricción `UNIQUE`.
- ✅ Estándar REST: recomendado en especificaciones de idempotencia (RFC 9110).

**Flujo:**
1. Buyer genera `externalId` (ej. UUIDv4) y envía con POST.
2. Seller busca `Order` por `externalId` — si existe, devuelve 200 + la orden existente.
3. Si no existe, crea en transacción; si hay carrera, BD rechaza violación de UNIQUE y seller reintenta lectura.

**Alternativas consideradas:**
- Header `Idempotency-Key`: válido pero menos explícito; requiere tabla de idempotencia por separado.
- Tabla `Idempotency` separada: más flexible pero añade complejidad.

---

### 2.3 Atomicidad: Transacción Prisma

**Decisión:** Usar `prisma.$transaction()` para crear `Order` + `OrderItem`s y decrementar stock.

**Justificación:**
- ✅ Garantía ACID: si algún paso falla, toda la operación se revierte.
- ✅ Consistencia de stock: no hay riesgo de overselling.
- ✅ Integridad de relaciones: orden con items siempre consistentes.

**Operaciones en transacción:**
1. Crear `Order` con `externalId`.
2. Crear N registros `OrderItem` (uno por producto).
3. Decrementar `product.stock` para cada producto.

Si alguno falla → rollback automático.

---

### 2.4 Validación Rigurosa

**Decisión:** Validar payload antes de tocar BD.

**Justificaciones:**
- ✅ Rechazo temprano de requests inválidas.
- ✅ Mensajes de error claros para debugging.
- ✅ Protección contra inyecciones y malformed JSON.

**Validaciones:**
- Campos obligatorios: `externalId`, `vendorId`, `buyerId`, `items[]`, `total`.
- Tipos: `externalId` string no vacío; `vendorId`, `buyerId` validen como IDs; `items` array no vacío.
- Stock: cada producto debe tener suficiente inventario.
- Total: suma(cantidad × precio) debe coincidir con `total` ±0.01 (tolerancia por redondeo).
- Permisos: todos los productos pertenecen al `vendorId`.

---

### 2.5 Manejo de Concurrencia

**Decisión:** Combinar chequeo previo + restricción `UNIQUE` + retry de lectura.

**Justificación:**
- ✅ Rápida path (99% casos): buscar por `externalId` antes de crear.
- ✅ Seguridad: BD previene duplicados incluso si dos requests crean simultáneamente.
- ✅ Consistencia: ambos clientes reciben respuesta válida (existente o recién creado).

**Flujo:**
```
1. SELECT * FROM Order WHERE externalId = ? 
   → Si existe: return 200 + orden existente.
2. INSERT Order + OrderItems + UPDATE products (en transacción)
   → Si Unique violation en externalId:
     • Esperar 100ms
     • SELECT * FROM Order WHERE externalId = ?
     • return 200 + orden recién creada por otro request.
```

---

## 3. Especificación Técnica

### 3.1 Endpoint

```
POST /api/orders
Content-Type: application/json
X-API-Key: ${BUYER_API_KEY}

{
  "externalId": "buyer-order-uuid-12345",
  "vendorId": "vendor-id-abc",
  "buyerId": "buyer-id-xyz",
  "items": [
    { "productId": "prod-1", "quantity": 2 },
    { "productId": "prod-2", "quantity": 1 }
  ],
  "total": 150.50
}
```

### 3.2 Respuestas

**201 Created** (nueva orden):
```json
{
  "success": true,
  "orderId": "ord-123",
  "externalId": "buyer-order-uuid-12345",
  "status": "PENDING",
  "total": 150.50
}
```

**200 OK** (orden ya existe — idempotencia):
```json
{
  "success": true,
  "orderId": "ord-123",
  "externalId": "buyer-order-uuid-12345",
  "status": "PENDING",
  "total": 150.50,
  "note": "Orden ya existía"
}
```

**400 Bad Request** (validación fallida):
```json
{
  "error": "Stock insuficiente para producto prod-1 (requiere 5, disponibles 3)"
}
```

**401 Unauthorized** (API key inválida):
```json
{
  "error": "X-API-Key inválida o faltante"
}
```

**409 Conflict** (externalId ya usado para diferente pedido):
```json
{
  "error": "externalId ya fue usado para un pedido diferente"
}
```

### 3.3 Códigos HTTP

| Código | Significado | Cuándo |
|--------|-------------|--------|
| 201 | Creado | Nueva orden insertada exitosamente. |
| 200 | OK | Orden ya existía (idempotencia). |
| 400 | Bad Request | Validación fallida (stock, total, tipos). |
| 401 | Unauthorized | API key faltante o incorrecta. |
| 409 | Conflict | externalId duplicado para orden diferente. |
| 500 | Internal Error | Error BD u otro servidor. |

---

## 4. Cambios en Schema Prisma

### 4.1 Modificación del Modelo `Order`

**Archivo:** `prisma/schema.prisma`

**Cambio:**
```prisma
model Order {
  id         String      @id @default(cuid())
  externalId String?     @unique  // ← NUEVO: garantiza unicidad
  vendorId   String
  buyerId    String
  status     OrderStatus @default(PENDING)
  total      Float
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  vendor     Vendor      @relation(fields: [vendorId], references: [id])
  items      OrderItem[]
}
```

**Justificación:**
- `@unique`: BD previene dos órdenes con mismo `externalId`.
- `String?` (nullable): Permite órdenes legadas sin `externalId` si migramos desde sistema anterior.

### 4.2 Migración Prisma

**Comando:**
```bash
npx prisma migrate dev --name add_externalId_to_order
```

**Archivo generado:** `prisma/migrations/20250511_add_externalId_to_order/migration.sql`

```sql
-- AlterTable
ALTER TABLE "Order" ADD COLUMN "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_externalId_key" ON "Order"("externalId");
```

---

## 5. Implementación del Endpoint

### 5.1 Archivo: `src/app/api/orders/route.ts`

**Responsabilidades:**
- Validar autenticación (API key).
- Parsear y validar JSON.
- Consultar productos y validar stock.
- Ejecutar transacción para crear orden.
- Manejar condiciones de carrera.

**Código:**
[Ver archivo completo en sección 5.2]

### 5.2 Pseudocódigo Detallado

```
POST /api/orders
1. Validar API key del header X-API-Key
   → Si falta o incorrecto: return 401

2. Parsear JSON del body
   → Si JSON inválido: return 400

3. Validar esquema con zod
   → Si tipos/campos inválidos: return 400

4. Buscar Order por externalId
   → Si existe: return 200 + orden existente (idempotencia rápida)

5. Buscar Vendor por vendorId
   → Si no existe: return 400 "Vendor no encontrado"

6. Buscar todos los Products por productIds
   → Si falta alguno o no pertenece al vendorId: return 400

7. Validar stock para cada item
   → Si insuficiente: return 400 "Stock insuficiente"

8. Calcular totalComputado = sum(item.quantity * product.price)
   → Si |totalComputado - total| > 0.01: return 400 "Total incorrecto"

9. EN TRANSACCIÓN:
   a. Crear Order con externalId, vendorId, buyerId, status=PENDING, total
   b. Crear OrderItem para cada item (con snapshot de nombre/precio)
   c. Decrementar product.stock para cada item
   d. Si error de violación de UNIQUE en externalId:
      • Esperar 100ms
      • Releer Order por externalId
      • return 200 + orden leída

10. Log auditoría: externalId, vendorId, buyerId, timestamp
11. return 201 + orden creada
```

---

## 6. Validación y Extensión en `src/lib/validation.ts`

### 6.1 Esquema Zod para Pedido Entrante

```typescript
import { z } from 'zod'

export const CreateOrderSchema = z.object({
  externalId: z.string().min(1, 'externalId es requerido'),
  vendorId: z.string().min(1, 'vendorId es requerido'),
  buyerId: z.string().min(1, 'buyerId es requerido'),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'productId es requerido'),
      quantity: z.number().int().min(1, 'quantity debe ser ≥ 1'),
    })
  ).min(1, 'items debe contener al menos 1 producto'),
  total: z.number().positive('total debe ser > 0'),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
```

---

## 7. Tests

### 7.1 Tests Unitarios (validación Zod)

**Archivo:** `tests/api/orders.validation.test.ts` (sugerido)

```typescript
import { CreateOrderSchema } from '@/lib/validation'

describe('CreateOrderSchema', () => {
  it('válido con payload correcto', () => {
    const payload = {
      externalId: 'buyer-1234',
      vendorId: 'ven-abc',
      buyerId: 'buy-xyz',
      items: [{ productId: 'prod-1', quantity: 2 }],
      total: 50.00,
    }
    expect(CreateOrderSchema.safeParse(payload).success).toBe(true)
  })

  it('rechaza externalId vacío', () => {
    const payload = { ...validPayload, externalId: '' }
    expect(CreateOrderSchema.safeParse(payload).success).toBe(false)
  })

  it('rechaza items vacío', () => {
    const payload = { ...validPayload, items: [] }
    expect(CreateOrderSchema.safeParse(payload).success).toBe(false)
  })

  it('rechaza quantity no entero', () => {
    const payload = { ...validPayload, items: [{ productId: 'p1', quantity: 1.5 }] }
    expect(CreateOrderSchema.safeParse(payload).success).toBe(false)
  })
})
```

### 7.2 Tests de Integración (Endpoint)

**Archivo:** `tests/api/orders.e2e.test.ts` (sugerido)

```typescript
import { POST } from '@/app/api/orders/route'

describe('POST /api/orders', () => {
  it('crea orden nueva con externalId', async () => {
    const res = await POST(new Request(
      'http://localhost:3000/api/orders',
      {
        method: 'POST',
        headers: { 'X-API-Key': process.env.BUYER_API_KEY!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ externalId: 'ext-1', vendorId: 'ven-1', buyerId: 'buy-1', items: [...], total: 50 })
      }
    ))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.orderId).toBeDefined()
  })

  it('devuelve 200 y la orden existente (idempotencia)', async () => {
    // Crear orden con externalId 'ext-2'
    // Reenviar POST con mismo externalId
    // Verificar que responde 200 y orderId es idéntico
  })

  it('rechaza API key inválida', async () => {
    const res = await POST(new Request(..., { headers: { 'X-API-Key': 'INVALIDA' } }))
    expect(res.status).toBe(401)
  })

  it('rechaza stock insuficiente', async () => {
    // Pedido con cantidad mayor al stock disponible
    const res = await POST(...)
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: /stock/i })
  })

  it('maneja concurrencia (dos requests paralelos mismo externalId)', async () => {
    const payload = { externalId: 'ext-3', vendorId: 'ven-1', buyerId: 'buy-1', items: [...], total: 50 }
    const [res1, res2] = await Promise.all([
      POST(req1(payload)),
      POST(req2(payload)),
    ])
    // Ambos deben ser exitosos; al menos uno será 201, otro 200
    expect([res1.status, res2.status]).toEqual(expect.arrayContaining([201, 200]))
    // Mismo orderId en ambas respuestas
    const data1 = await res1.json(), data2 = await res2.json()
    expect(data1.orderId).toBe(data2.orderId)
  })

  it('rechaza total incorrecto', async () => {
    // items: [{productId, quantity}] con precio en BD, pero total no coincide
    const res = await POST(...)
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: /total/i })
  })
})
```

### 7.3 Tests Manuales con curl

```bash
# 1. Crear orden nueva
curl -X POST http://localhost:3000/api/orders \
  -H "X-API-Key: ${BUYER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "buyer-order-001",
    "vendorId": "ven-abc123",
    "buyerId": "buyer-xyz789",
    "items": [
      { "productId": "prod-1", "quantity": 2 },
      { "productId": "prod-2", "quantity": 1 }
    ],
    "total": 150.50
  }'

# Respuesta esperada: 201 Created + orden

# 2. Reenviar con mismo externalId (idempotencia)
curl -X POST http://localhost:3000/api/orders \
  -H "X-API-Key: ${BUYER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "buyer-order-001",
    ...
  }'

# Respuesta esperada: 200 OK + misma orden

# 3. API key incorrecta
curl -X POST http://localhost:3000/api/orders \
  -H "X-API-Key: INVALIDA" \
  ...

# Respuesta esperada: 401 Unauthorized
```

---

## 8. Pasos de Despliegue

### 8.1 Desarrollo Local

```bash
# 1. Actualizar schema
# Editar prisma/schema.prisma (campo externalId)

# 2. Ejecutar migración
npx prisma migrate dev --name add_externalId_to_order

# 3. Crear archivo .env.local (si no existe)
# BUYER_API_KEY=buyer-secret-key-12345

# 4. Iniciar servidor
npm run dev

# 5. Probar con curl (ver sección 7.3)
```

### 8.2 Pre-Producción (Staging)

```bash
# 1. Merge a rama staging
# 2. Ejecutar migración en BD staging
# npx prisma migrate deploy --env staging

# 3. Verificar con pruebas E2E en ambiente staging
npm run test:e2e -- --env staging

# 4. Revisar logs y métricas
```

### 8.3 Producción

```bash
# 1. Merge a main
# 2. CI/CD ejecuta:
#    - npx prisma migrate deploy (en BD producción)
#    - npm run build
#    - npm run test (validaciones básicas)

# 3. Deploy de app (Vercel, Railway, etc.)

# 4. Monitoreo:
#    - Logs de endpoint POST /api/orders
#    - Stock y Orders creadas/hora
#    - Errores y excepciones
```

### 8.4 Variables de Entorno Requeridas

```
BUYER_API_KEY=<buyer-app-secret-key>
DATABASE_URL=postgresql://...
```

---

## 9. Observabilidad y Auditoría

### 9.1 Logging Recomendado

```typescript
// En handler POST /api/orders

// Antes de crear
logger.info('Order creation request', {
  externalId,
  vendorId,
  buyerId,
  itemsCount: items.length,
  total,
  timestamp: new Date(),
})

// Exitoso
logger.info('Order created', {
  orderId,
  externalId,
  vendorId,
  stock_changes: [...],
  duration_ms: Date.now() - startTime,
})

// Error
logger.error('Order creation failed', {
  externalId,
  reason: error.message,
  code: error.code,
})
```

### 9.2 Métricas Sugeridas

- Órdenes creadas/hora
- Tasa de idempotencia (reintentos detectados)
- Errores por razón (validación, stock, auth)
- Latencia p50/p95/p99

---

## 10. Limitaciones y Consideraciones Futuras

### 10.1 Limitaciones Actuales

| Limitación | Descripción | Mitigación |
|------------|-------------|-----------|
| API key global | No hay rotación dinámica. | Para MVP es suficiente; migrar a JWT cuando escale. |
| Sin rate limit | Buyer app puede spamear requests. | Implementar rate limit en middleware. |
| Notificación síncrona | Seller se entera cuando polling. | Agregar WebSocket o cola asíncrona (SQS/Redis). |
| Sin rollback automático de stock | Si comprador cancela después, stock no se restaura. | Implementar endpoint PATCH de cancelación. |

### 10.2 Próximos Pasos Recomendados

1. **Rate limiting:** Middleware para limitar requests por API key.
2. **Notificaciones en tiempo real:** WebSocket o Pub/Sub para alertar al seller.
3. **Cancelación de órdenes:** Endpoint PATCH `/api/orders/{id}` para cancelar y restaurar stock.
4. **Autenticación escalable:** Migrar a JWT cuando haya múltiples buyers.
5. **Auditoría completa:** Tabla `AuditLog` que registre todo cambio en órdenes.
6. **Analytics:** Dashboard de órdenes por hora, producto más vendido, etc.

---

## 11. Referencias y Recursos

- **Prisma Transactions:** https://www.prisma.io/docs/concepts/components/prisma-client/transactions
- **Idempotency (RFC 9110):** https://datatracker.ietf.org/doc/html/rfc9110#section-9.2.2
- **Zod Schema Validation:** https://zod.dev/
- **Next.js API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

## 12. Checklist de Implementación

- [ ] Actualizar `prisma/schema.prisma` con campo `externalId`.
- [ ] Ejecutar `npx prisma migrate dev --name add_externalId_to_order`.
- [ ] Crear `src/app/api/orders/route.ts` con handler POST.
- [ ] Extender `src/lib/validation.ts` con `CreateOrderSchema`.
- [ ] Crear tests unitarios en `tests/api/orders.validation.test.ts`.
- [ ] Crear tests E2E en `tests/api/orders.e2e.test.ts`.
- [ ] Probar manualmente con curl.
- [ ] Verificar concurrencia (2 requests paralelos con mismo externalId).
- [ ] Validar que stock se decrementa correctamente.
- [ ] Documentar en `.env.local` la variable `BUYER_API_KEY`.
- [ ] Revisar logs y monitoreo en staging antes de producción.
- [ ] Deploy a producción con migración BD.

---

**Fin del documento.**  
Para preguntas o ajustes, consulta el plan en `/memories/session/plan.md` o contacta al equipo de desarrollo.
