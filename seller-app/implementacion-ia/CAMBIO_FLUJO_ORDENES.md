# Cambio de Flujo de Órdenes: PaymentsApp → SellerApp (solo PAID/READY)

**Fecha:** Mayo 16, 2026  
**Estado:** ✅ IMPLEMENTADO  
**Propósito:** Rediseñar el flujo de órdenes para que PaymentsApp sea quien envía las órdenes (pre-pagadas) y SellerApp solo gestione la transición PAID → READY.

---

## 1. Resumen Ejecutivo

Se simplifica el modelo de órdenes eliminando estados intermedios (PENDING, CONFIRMED, IN_DELIVERY, DELIVERED, CANCELLED) y reduciendo a solo **2 estados**: `PAID` y `READY`. El flujo ahora es:

1. **PaymentsApp** envía la orden vía `POST /api/orders` (autenticada con `PAYMENTS_API_KEY`) → la orden se crea directamente como `PAID`.
2. **Seller** (vía dashboard) marca la orden como `READY` → visible para DeliveryApp.
3. **DeliveryApp** consume `GET /api/orders/status/ready` para obtener órdenes listas.

Se agrega además el campo `address` a la orden (dirección de entrega del comprador).

---

## 2. Decisiones de Diseño

### 2.1 Solo 2 estados: PAID y READY

| Decisión | Justificación |
|----------|---------------|
| Eliminar PENDING | Las órdenes llegan pre-pagadas desde PaymentsApp, no hay estado "pendiente de pago" en SellerApp |
| Eliminar CONFIRMED | Ya no existe paso intermedio de confirmación manual |
| Eliminar IN_DELIVERY, DELIVERED, CANCELLED | La gestión logística pasa a DeliveryApp, que tendrá su propio seguimiento |

### 2.2 Autenticación separada para PaymentsApp

Se crea `PAYMENTS_API_KEY` (independiente de `BUYER_API_KEY`) para que PaymentsApp tenga su propia credencial al enviar órdenes.

### 2.3 Address como string libre

Se almacena como `String?` en el modelo Order. PaymentsApp envía la dirección completa como texto plano.

### 2.4 Eliminación de endpoints legacy del middleware

Se eliminan del `proxy.ts` las rutas protegidas que ya no tienen sentido:
- `delivery-started` (no más IN_DELIVERY)
- `payment-confirmed` (las órdenes ya llegan pagadas)
- `delivery-status` (gestión pasa a DeliveryApp)
- `incident` (no más estado fallido)

---

## 3. Archivos Creados/Modificados

| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | Enum `OrderStatus` reducido a `PAID, READY`. `Order.address` agregado. Default cambiado a `PAID`. |
| `prisma/seed.ts` | Órdenes actualizadas a `PAID`/`READY` con `address` |
| `.env` | Nueva variable `PAYMENTS_API_KEY` |
| `src/lib/validation.ts` | `CreateOrderInput` + `validateCreateOrderInput` incluyen `address` |
| `src/app/api/orders/route.ts` | Auth cambia a `PAYMENTS_API_KEY`, status `PAID`, payload incluye `address` |
| `src/app/actions/order.ts` | `allowedStatusTransitions` solo `PAID → READY`, `READY: []` |
| `src/components/OrdersList.tsx` | `statusConfig` solo PAID/READY, `canConfirm` en PAID, muestra `address` |
| `src/components/orders/ConfirmOrderDialog.tsx` | Texto actualizado a "Pagada" → "Lista para entregar" |
| `src/proxy.ts` | Eliminadas rutas protegidas legacy |
| `AGENTS.md` | Estados, APIs y flujo actualizados |

---

## 4. Detalle de Cambios por Archivo

### 4.1 `prisma/schema.prisma`

```diff
 enum OrderStatus {
-  PENDING
-  CONFIRMED
   PAID
   READY
-  IN_DELIVERY
-  DELIVERED
-  CANCELLED
 }

 model Order {
   ...
-  status     OrderStatus @default(PENDING)
+  status     OrderStatus @default(PAID)
+  address    String?
   ...
 }
```

### 4.2 `src/app/api/orders/route.ts`

| Aspecto | Antes | Después |
|---------|-------|---------|
| Autenticación | `BUYER_API_KEY` | `PAYMENTS_API_KEY` |
| Status al crear | `'PENDING'` | `'PAID'` |
| Payload | sin address | incluye `address` |
| Comentario | "Recibe pedidos desde BuyerApp" | "Recibe pedidos desde PaymentsApp" |

### 4.3 `src/app/actions/order.ts`

```diff
 const allowedStatusTransitions = {
-  PENDING: ['CONFIRMED', 'READY', 'CANCELLED'],
-  CONFIRMED: ['READY', 'CANCELLED'],
-  READY: ['IN_DELIVERY', 'CANCELLED'],
-  IN_DELIVERY: ['DELIVERED', 'CANCELLED'],
-  DELIVERED: [],
-  CANCELLED: [],
+  PAID: ['READY'],
+  READY: [],
 }
```

Se elimina el early return de "mismo status" en `updateOrderStatus` (innecesario cuando solo PAID transiciona a READY y READY no tiene salidas).

### 4.4 `src/components/OrdersList.tsx`

- `statusConfig` reducido a solo `PAID` (icono `CheckCircle` verde) y `READY` (icono `Package` azul)
- `canConfirm` cambia de `order.status === 'PENDING'` a `order.status === 'PAID'`
- Se agrega la dirección de entrega en los detalles de la orden

### 4.5 `src/components/orders/ConfirmOrderDialog.tsx`

Texto actualizado:
- Antes: "Esta acción moverá la orden de **Pendiente** a **Lista para entregar**."
- Después: "Esta acción moverá la orden de **Pagada** a **Lista para entregar**."

### 4.6 `src/proxy.ts`

Se eliminan las rutas de `isProtectedApiRoute`:
- ~~`/api/orders/(.*)/delivery-started`~~
- ~~`/api/orders/(.*)/payment-confirmed`~~
- ~~`/api/orders/(.*)/delivery-status`~~
- ~~`/api/orders/(.*)/incident`~~

Dado que `isProtectedApiRoute` queda vacío, se elimina todo el bloque de validación `X-Service-Token` y la variable `isProtectedApiRoute`.

### 4.7 `.env`

Se agrega:
```
PAYMENTS_API_KEY="aguaya-payments-secret-key-123"
```

---

## 5. Migración de BD

```bash
npx prisma migrate dev --name simplify-order-status
```

Esto genera una migración que:
1. Altera el enum `OrderStatus` (solo PAID, READY)
2. Agrega columna `address` nullable a la tabla `Order`
3. Cambia el default de `status` a `PAID`

> **Nota:** Las órdenes existentes en la BD con estados PENDING, CONFIRMED, IN_DELIVERY, DELIVERED o CANCELLED quedarán huérfanas. Se recomienda migrarlas manualmente antes de aplicar este cambio en producción.

---

## 6. Nuevo Flujo de Órdenes

```
PaymentsApp                          SellerApp                          DeliveryApp
     │                                   │                                   │
     │  POST /api/orders                  │                                   │
     │  (PAYMENTS_API_KEY)                │                                   │
     │──────────────────────────────────>│                                   │
     │                                   │                                   │
     │  status: PAID                      │                                   │
     │  total, items, address             │                                   │
     │                                   │                                   │
     │                                   │  Vendedor ve orden PAID            │
     │                                   │  en dashboard                      │
     │                                   │                                   │
     │                                   │  Marca como READY                  │
     │                                   │  (confirmOrderForDelivery)         │
     │                                   │                                   │
     │                                   │  GET /api/orders/status/ready      │
     │                                   │<──────────────────────────────────│
     │                                   │  (TODOs)                           │
```

---

## 7. Estados de Orden (nuevos)

| Estado | Descripción | Quién lo setea |
|--------|-------------|----------------|
| `PAID` | PaymentsApp confirmó el cobro. El vendedor ve la orden en su dashboard. | PaymentsApp via API |
| `READY` | El vendedor preparó el pedido y está listo para que DeliveryApp lo retire. | Seller vía dashboard |

---

## 8. APIs inter-servicios (actualizado)

### SellerApp expone (cambios)

| Método | Endpoint | Consumidor | Descripción | Estado |
|--------|----------|-----------|-------------|--------|
| POST | `/api/orders` | PaymentsApp | Recibe pedidos pagados desde PaymentsApp. Auth: `PAYMENTS_API_KEY`. | ✅ ACTUALIZADO |
| POST | `/api/orders/:order_id/status/ready` | DeliveryApp | Marca una orden como entregada al delivery. | 🔄 TODO |
| GET | `/api/orders/status/ready` | DeliveryApp | Lista pedidos en estado `READY`. | 🔄 TODO |
| POST | `/api/orders/:order_id/delivery-started` | ~~DeliveryApp~~ | ~~Marca el pedido como en_camino, descuenta stock~~ | ❌ ELIMINADO |
| POST | `/api/orders/:order_id/payment-confirmed` | ~~PaymentsApp~~ | ~~Marca el pedido como pagado~~ | ❌ ELIMINADO |
| PUT | `/api/orders/:order_id/delivery-status` | ~~DeliveryApp~~ | ~~Actualiza el estado logístico~~ | ❌ ELIMINADO |
| PUT | `/api/orders/:order_id/incident` | ~~DeliveryApp~~ | ~~Registra un incidente~~ | ❌ ELIMINADO |

---

## 9. Prerrequisitos en Producción

1. Las órdenes existentes en BD con estados legacy (PENDING, CONFIRMED, etc.) deben migrarse manualmente antes de deployar.
2. PaymentsApp debe configurar `PAYMENTS_API_KEY` para llamar a `POST /api/orders`.
3. Los consumers de los endpoints eliminados (DeliveryApp) deben actualizarse para no depender de ellos.

---

## Archivos Relacionados

- [`prisma/schema.prisma`](../prisma/schema.prisma) — Modelo Order y enum OrderStatus
- [`prisma/seed.ts`](../prisma/seed.ts) — Datos de prueba actualizados
- [`src/lib/validation.ts`](../src/lib/validation.ts) — Validación de payload con address
- [`src/app/api/orders/route.ts`](../src/app/api/orders/route.ts) — POST endpoint para PaymentsApp
- [`src/app/actions/order.ts`](../src/app/actions/order.ts) — Server actions simplificadas
- [`src/components/OrdersList.tsx`](../src/components/OrdersList.tsx) — Lista de órdenes actualizada
- [`src/components/orders/ConfirmOrderDialog.tsx`](../src/components/orders/ConfirmOrderDialog.tsx) — Diálogo actualizado
- [`src/proxy.ts`](../src/proxy.ts) — Middleware sin rutas legacy
- [`AGENTS.md`](../AGENTS.md) — Documentación del proyecto actualizada
