# Implementación: Confirmar Órdenes como Listas para Delivery (PAID → READY)

**Fecha:** Mayo 16, 2026  
**Estado:** ✅ IMPLEMENTADO  
**Propósito:** Al confirmar una orden (PAID → READY), notificar a DeliveryApp y BuyerApp vía HTTP con reintentos automáticos ante fallos mediante un patrón Outbox.

---

## 1. Resumen Ejecutivo

Cuando el vendedor marca una orden como `READY` (lista para entregar), el sistema:

1. Actualiza el estado local en SellerApp (`PAID` → `READY`).
2. Notifica a **DeliveryApp** (PUT `/api/ready_orders/:order_id`) para que el pedido aparezca en su flota.
3. Notifica a **BuyerApp** (PATCH `/api/orders/:order_id/status`) para que el comprador vea que su pedido está listo.
4. Si alguna notificación externa falla, se encola en una tabla `Outbox` para reintentar automáticamente cada 60 segundos.

Esto garantiza **consistencia eventual**: aunque DeliveryApp o BuyerApp estén caídas en el momento de la confirmación, la notificación se reintenta hasta 10 veces (~10 minutos).

---

## 2. Decisiones de Diseño

### 2.1 Patrón Outbox para notificaciones diferidas

**Problema:** Si DeliveryApp está temporalmente caída, la orden se marca READY localmente pero nunca llega a la tabla de DeliveryApp. El repartidor no ve la orden.

**Solución:** Tabla `Outbox` en la misma BD de SellerApp. Cuando una notificación externa falla, se persiste el intento. Un proceso periódico (cada 60s) reintenta las pendientes.

```
confirmOrderForDelivery(orderId)
  │
  ├── 1. prisma.order.update → status = 'READY'
  │
  ├── 2. try: PUT /api/ready_orders/:id (DeliveryApp)
  │         └── catch: INSERT Outbox(target='delivery')
  │
  ├── 3. try: PATCH /api/orders/:id/status (BuyerApp)
  │         └── catch: INSERT Outbox(target='buyer')
  │
  └── 4. revalidatePath + revalidateTag

[setInterval 60s]
  └── processOutbox()
        └── SELECT * FROM Outbox WHERE status = 'PENDING'
              └── for each: reintentar HTTP call
                    ├── éxito → UPDATE status = 'SENT'
                    └── fallo → incrementar retries
                          └── si retries > 10 → status = 'FAILED'
```

**Ventajas:**
- ✅ Persistente: sobrevive reinicios del servidor.
- ✅ Simple: No requiere Redis, colas externas ni workers.
- ✅ Transaccional: la notificación fallida se guarda en la misma BD que la orden.
- ✅ Predecible: máximo 10 reintentos (~10 min), luego se marca como fallido para revisión manual.

### 2.2 Dashboard partido en dos secciones

| Sección | Status | Acción del vendedor |
|---------|--------|---------------------|
| **Para confirmar** | `PAID` | Botón "Confirmar" → READY |
| **Listas para entregar** | `READY` | Solo lectura, sin botón |

Cada sección muestra su propio contador y mensaje "vacío" independiente.

### 2.3 Autenticación entre servicios

SellerApp usa API keys específicas por servicio destino:

| Variable | Uso |
|----------|-----|
| `DELIVERY_API_KEY` | Autentica contra DeliveryApp (header `X-API-Key`) |
| `BUYER_SERVICE_KEY` | Autentica contra BuyerApp (header `X-API-Key`) |

Cada app externa valida que la key coincida con la que tiene configurada.

---

## 3. Archivos Creados/Modificados

| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | Nuevo modelo `Outbox` + enum `OutboxStatus` |
| `src/lib/outbox.ts` | Creación: `enqueueNotification()`, `processOutbox()`, `startOutboxProcessor()` |
| `src/app/actions/order.ts` | `confirmOrderForDelivery` con notificaciones externas + fallback a Outbox |
| `src/components/OrdersList.tsx` | Dashboard partido en secciones PAID y READY |
| `.env` | Nuevas variables: `DELIVERY_APP_URL`, `BUYER_APP_URL`, `DELIVERY_API_KEY`, `BUYER_SERVICE_KEY` |

---

## 4. Detalle de Implementación

### 4.1 Modelo Outbox (`prisma/schema.prisma`)

```prisma
enum OutboxStatus {
  PENDING
  SENT
  FAILED
}

model Outbox {
  id        String       @id @default(cuid())
  orderId   String
  target    String       // 'delivery' | 'buyer'
  method    String       // 'PUT' | 'PATCH'
  url       String
  body      String       // JSON string
  status    OutboxStatus @default(PENDING)
  retries   Int          @default(0)
  lastError String?
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}
```

### 4.2 Módulo Outbox (`src/lib/outbox.ts`)

```typescript
/**
 * outbox.ts — Sistema de cola de notificaciones para servicios externos.
 *
 * Propósito:
 *   Cuando falla una notificación a DeliveryApp o BuyerApp al confirmar
 *   una orden como READY, se encola en la tabla Outbox para reintentar
 *   automáticamente cada 60 segundos.
 *
 * Funciones:
 *   enqueueNotification()  → Inserta un registro pendiente en Outbox
 *   processOutbox()        → Reintenta notificaciones pendientes
 *   startOutboxProcessor() → Inicia setInterval que corre processOutbox cada 60s
 */
```

### 4.3 Acción de confirmar (`src/app/actions/order.ts`)

La función `confirmOrderForDelivery` ahora:

1. Llama a `updateOrderStatus(orderId, 'READY')` (código existente).
2. Construye los payloads para DeliveryApp y BuyerApp con los datos del vendedor.
3. Intenta ambos HTTP calls en paralelo con `Promise.allSettled`.
4. Si alguno falla, llama a `enqueueNotification()` para persistir el intento.
5. Retorna la orden actualizada sin bloquear al usuario por fallos externos.

### 4.4 Dashboard partido (`src/components/OrdersList.tsx`)

Se filtran las órdenes por `order.status`:

```typescript
const paidOrders = orders.filter((o) => o.status === 'PAID')
const readyOrders = orders.filter((o) => o.status === 'READY')
```

Cada sección tiene:
- Título con contador: "Para confirmar (3)" / "Listas para entregar (5)"
- Mensaje de vacío individual
- Las PAID muestran el botón "Confirmar"; las READY no

---

## 5. Configuración de Entorno

Agregar al `.env`:

```env
# URLs de servicios externos
DELIVERY_APP_URL=http://localhost:3001
BUYER_APP_URL=http://localhost:3002

# API keys para autenticación saliente
DELIVERY_API_KEY=delivery-secret-key-123
BUYER_SERVICE_KEY=buyer-service-key-456
```

---

## 6. Manejo de Errores

| Escenario | Comportamiento |
|-----------|---------------|
| DeliveryApp responde 200 | Notificación exitosa. No se guarda en Outbox. |
| DeliveryApp responde 5xx / timeout | Se guarda en Outbox como `PENDING`. Reintento automático. |
| DeliveryApp responde 4xx (ej: 400) | Se guarda en Outbox. El reintento fallará igual, pero queda registro. |
| BuyerApp caída | Ídem DeliveryApp. Outbox con target `buyer`. |
| Ambas caídas | Dos registros en Outbox, uno por cada target. |
| Outbox agota reintentos (10) | Status pasa a `FAILED`. Queda registro para revisión manual. |

---

## 7. Archivos Relacionados

- [`prisma/schema.prisma`](../prisma/schema.prisma) — Modelo Outbox + enum
- [`src/lib/outbox.ts`](../src/lib/outbox.ts) — Lógica de cola de notificaciones
- [`src/app/actions/order.ts`](../src/app/actions/order.ts) — Server action con notificaciones externas
- [`src/components/OrdersList.tsx`](../src/components/OrdersList.tsx) — Dashboard con secciones partidas
- [`.env`](../.env) — Variables de entorno para URLs y API keys
- [`CAMBIO_FLUJO_ORDENES.md`](./CAMBIO_FLUJO_ORDENES.md) — Documentación del cambio de flujo previo
