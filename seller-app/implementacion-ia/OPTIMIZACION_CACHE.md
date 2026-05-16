# Optimización de Caché con `unstable_cache`

**Fecha:** Mayo 15, 2026  
**Estado:** ✅ IMPLEMENTADO (v2 con revalidateTag + cleanup por inactividad)

---

## Problema Detectado

Las consultas a Prisma se ejecutaban en **cada navegación entre pestañas del dashboard**, generando tiempos de carga elevados:

| Query | Tiempo típico | Se ejecutaba en |
|-------|---------------|-----------------|
| `prisma.vendor.findUnique` por `userId` | 200-1300ms | layout + cada página |
| `prisma.order.findMany` con includes | ~670ms | `/dashboard/orders` |
| `prisma.vendor.findUnique` overview | ~200-300ms | `/dashboard/overview` |
| `prisma.vendor.findUnique` productos | ~200ms | `/dashboard/products` |

**Causa raíz:** React `cache()` deduplica consultas dentro del **mismo request**, pero al navegar entre páginas (nuevo request), el cache se pierde y se vuelve a consultar la BD.

---

## Solución Implementada

Se agregó una **segunda capa de caché** con `unstable_cache` de Next.js que **persiste entre requests**, combinado con un sistema de **invalidación explícita** (`revalidateTag`) y **limpieza automática por inactividad**.

### Arquitectura de Caché

```
┌─ Request ───────────────────────────────────────┐
│                                                  │
│  React cache() ────── intra-request              │  ← deduplica si layout + page llaman
│       │                                          │     al mismo userId en el mismo request
│       ▼                                          │
│  unstable_cache ───── inter-request               │  ← persiste entre navegaciones
│       │  + tags: ['vendor','orders',...]         │
│       │  + revalidate: 10-60s                    │
│       │                                          │
│       ▼                                          │
│  Data Cache (Next.js) ─── .next/cache/fetch-cache/│  ← filesystem
│       │                                          │
│       ▼                                          │
│  PostgreSQL (Railway)                             │
└──────────────────────────────────────────────────┘

┌─ Invalidación ───────────────────────────────────┐
│                                                   │
│  Server Action / API                              │
│       │                                           │
│       ├── revalidatePath(path)  → re-render page  │
│       └── revalidateTag(tag)    → borra Data Cache│
│                                                   │
└───────────────────────────────────────────────────┘

┌─ Cleanup por inactividad ────────────────────────┐
│                                                   │
│  setInterval(cada 10 min)                         │
│       │                                           │
│       └── ¿tag sin acceso > 30 min?               │
│             └── revalidateTag(tag)  → limpia cache│
│                                                   │
│  Así, si no hay vendedores activos,               │
│  su caché se limpia automáticamente.              │
└───────────────────────────────────────────────────┘
```

---

## Módulo Creado

**Archivo:** `src/lib/cache.ts`

| Función | Cachea | TTL | Tags |
|---------|--------|-----|------|
| `getCachedVendorByUserId(userId)` | Datos del vendor por Clerk userId | 60s | `vendor` |
| `getCachedOverview(vendorId)` | Overview del dashboard (métricas + recientes) | 15s | `overview` |
| `getCachedVendorProducts(vendorId)` | Catálogo de productos del vendor | 10s | `products` |
| `getCachedVendorOrders(vendorId)` | Órdenes del vendor con items | 10s | `orders` |
| `getCachedProductById(id, vendorId)` | Producto individual (para edición) | 10s | `products` |

### Sistema de Activity Tracking (dentro de `cache.ts`)

Cada vez que se ejecuta una función cacheada, se registra el timestamp de acceso en un mapa interno:

```ts
const lastAccess = new Map<CacheTag, number>()
```

Un `setInterval` corre **cada 10 minutos** en el servidor y revisa qué tags no se accedieron en los últimos **30 minutos**. Los tags inactivos se limpian con `revalidateTag()` y se eliminan del registro.

```
Ejemplo:
  t=0min    → vendor A accede → tag 'orders' se marca activo
  t=25min   → vendor A cierra sesión
  t=35min   → cleanup: 'orders' no se accedió en 35 min (>30)
            → revalidateTag('orders')
            → entradas de órdenes en Data Cache eliminadas
            → lastAccess.delete('orders')
```

---

## Invalidación de Caché

Cada mutación invalida tanto el **Data Cache** (vía `revalidateTag`) como el **Router Cache** del cliente (vía `revalidatePath`), garantizando datos siempre frescos.

| Archivo | Acción | `revalidateTag` | `revalidatePath` |
|---------|--------|-----------------|-------------------|
| `actions/order.ts` | `updateOrderStatus` / `confirmOrderForDelivery` | `orders`, `overview` | `/dashboard/orders`, `/dashboard/overview` |
| `actions/product.ts` | `createProduct` | `products`, `overview` | `/dashboard/products`, `/dashboard/overview` |
| `actions/product.ts` | `updateProduct` | `products`, `overview` | `/dashboard/products`, `/dashboard/overview` |
| `actions/product.ts` | `deleteProduct` | `products`, `overview` | `/dashboard/products`, `/dashboard/overview` |
| `actions/vendor.ts` | `createOrUpdateVendor` | `vendor`, `overview`, `products` | `/dashboard/overview`, `/dashboard/products` |
| `api/orders/route.ts` | `POST /api/orders` | `orders`, `overview`, `products` | `/dashboard/orders`, `/dashboard/overview` |

---

## Archivos Modificados (total: 7 archivos)

| Archivo | Cambio |
|---------|--------|
| `src/lib/cache.ts` | Creación: 5 funciones cacheadas con tags + activity tracker + cleanup periódico |
| `src/lib/vendor-context.ts` | Reemplazada consulta directa a Prisma por `getCachedVendorByUserId()` |
| `src/app/actions/order.ts` | `getVendorOrders()` usa `getCachedVendorOrders()` + `revalidateTag` en mutaciones |
| `src/app/actions/product.ts` | `revalidateTag` en create, update, delete |
| `src/app/actions/vendor.ts` | `revalidateTag` en createOrUpdateVendor |
| `src/app/dashboard/overview/page.tsx` | Usa `getCachedOverview()` |
| `src/app/dashboard/products/page.tsx` | Usa `getCachedVendorProducts()` |
| `src/app/dashboard/products/[id]/page.tsx` | Usa `getCachedProductById()` |
| `src/app/api/orders/route.ts` | `revalidateTag` en POST order |

---

## Estrategia de TTL

| Dato | TTL | Justificación |
|------|-----|---------------|
| Perfil del vendor (nombre, dirección) | 60s | Cambia muy poco (solo si el vendor edita su perfil) |
| Overview (métricas, recientes) | 15s | Balance entre frescura de datos y rendimiento |
| Productos (stock, precios) | 10s | El stock cambia con cada pedido |
| Órdenes (listado completo) | 10s | Llegan pedidos nuevos frecuentemente |

---

## Impacto Esperado

| Página | Antes | Después (cache hit) |
|--------|-------|---------------------|
| `/dashboard/overview` | 1600-3800ms | **~50-200ms** |
| `/dashboard/orders` | 900-1800ms | **~50-200ms** |
| `/dashboard/products` | 700-1800ms | **~50-200ms** |
| Navegación entre pestañas | 700-3800ms | **~50-500ms** |

> Las mutaciones (`revalidateTag`) limpian el Data Cache inmediatamente, forzando un cache miss en el próximo request y garantizando datos frescos.

---

## ¿Dónde se almacena la cache?

`unstable_cache` guarda los datos en el **Data Cache** de Next.js:

- **Desarrollo** (`npm run dev`): En **memoria** del proceso Node. Se pierde al reiniciar.
- **Producción** (`next build` + `next start`): Serializado a JSON en **filesystem** (`.next/cache/fetch-cache/`).

No usa Redis ni BD externa. Cada entrada es un archivo JSON de ~0.5-15KB.

---

## Limpieza por inactividad

El sistema incorpora un tracker que monitorea accesos por tag:

| Parámetro | Valor |
|-----------|-------|
| Timeout de inactividad | 30 minutos |
| Intervalo de limpieza | 10 minutos |
| Mecanismo | `revalidateTag(tag)` sobre tags inactivos |

Esto evita que la cache acumule entradas de usuarios que ya no usan la aplicación. Si durante 30 minutos ningún vendedor accede a las órdenes, todas las entradas del tag `orders` se limpian automáticamente.

---

## Notas Técnicas

- `unstable_cache` es parte del **Data Cache** de Next.js y funciona tanto en Server Components como en Server Actions.
- React `cache()` se mantiene como capa externa para deduplicación intra-request.
- Los **tags** permiten invalidación selectiva por tipo de dato: limpiar solo productos sin tocar órdenes.
- `revalidateTag` + `revalidatePath` se usan juntos: el primero limpia el Data Cache, el segundo fuerza un re-render de la página.
- El cleanup por inactividad solo corre en el servidor (no durante el build).

---

## Archivos Relacionados

- [`src/lib/cache.ts`](../src/lib/cache.ts) — Funciones de caché con tags + activity tracker + cleanup
- [`src/lib/vendor-context.ts`](../src/lib/vendor-context.ts) — Vendor context con doble capa de caché
- [`src/app/actions/order.ts`](../src/app/actions/order.ts) — Server actions de órdenes
- [`src/app/actions/product.ts`](../src/app/actions/product.ts) — Server actions de productos
- [`src/app/actions/vendor.ts`](../src/app/actions/vendor.ts) — Server actions de vendedores
- [`src/app/api/orders/route.ts`](../src/app/api/orders/route.ts) — API de creación de órdenes

---

## Pendientes / Mejoras Futuras

1. Evaluar si conviene un TTL diferente para cada función según uso real
2. Agregar métricas de cache hit/miss para monitorear efectividad
3. Considerar caché en Redis para entornos multi-instancia en producción
4. Migrar tags dinámicos por usuario cuando la API de `unstable_cache` lo soporte
5. Agregar dashboard interno de monitoreo de caché
