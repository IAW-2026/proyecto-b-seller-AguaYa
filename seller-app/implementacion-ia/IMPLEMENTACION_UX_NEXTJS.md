# Implementación: Mejora UX y Performance en Next.js

Esta implementación aplica una primera capa de mejora de UX siguiendo las guías oficiales de Next.js para App Router. El foco está en reducir fricción visual, mejorar la percepción de carga y dejar preparada la base para optimizaciones de imágenes y estrategias estática/dinámica más finas.

## Objetivo

Mejorar la experiencia del usuario con cambios de alto impacto y bajo riesgo:

- tipografía global optimizada con `next/font`
- shell visual más consistente y legible
- estados de carga por segmento para el dashboard
- caché HTTP en APIs públicas de lectura
- base de configuración para optimización de imágenes

## Qué se implementó

### 1. Fonts optimizadas

Se reemplazó la fuente genérica del documento por `Geist` y `Geist_Mono` usando `next/font/google` en el layout raíz.

Decisiones técnicas:

- `display: 'swap'` para evitar texto invisible.
- variables CSS para conectar las fuentes con el theme global.
- fallback explícito en `globals.css` para mantener estabilidad si la carga de fuente tarda.

Impacto esperado:

- menor CLS por cambios de métrica tipográfica
- mejor consistencia visual entre rutas y estados de carga
- mejor lectura del contenido sin depender de fonts del sistema

### 2. Shell visual global

Se ajustó la base visual de la app para salir del blanco plano y dar una identidad más definida:

- fondo con gradiente suave y glow radial
- tipografía antialiased
- selección de texto con color consistente
- paneles con bordes suaves y sombras sutiles

Esto mejora la jerarquía visual sin introducir un rediseño completo.

### 3. Dashboard más escaneable

Se reemplazaron estilos inline en el layout del dashboard, sidebar, overview y products por clases utilitarias.

Se mejoró:

- navegación lateral con mejor contraste y estructura
- tarjetas de métricas más consistentes
- bloques de contenido con separación visual clara
- CTAs más reconocibles para acciones principales

### 4. Loading UI por segmento

Se agregó un componente compartido de skeleton para el dashboard y se expone a través de `loading.tsx` en segmentos clave.

Beneficios:

- el usuario ve una estructura de página real antes de que termine el fetch
- mejor percepción de velocidad en el cambio de rutas
- menor sensación de parpadeo o vacío

### 5. Caché en APIs públicas

Se agregó `Cache-Control` a los endpoints de lectura:

- `GET /api/products` con ventana corta de frescura y stale-while-revalidate
- `GET /api/vendors` con ventana ligeramente más amplia

Esto reduce latencia percibida y presión sobre la base de datos sin tocar la lógica de negocio.


### 6. Contexto de sesión-vendedor cacheado por usuario (keyed cache)

Se centralizó la autenticación y la resolución del vendor en un helper público `getVendorContext()` que ejecuta `auth()` por request y delega la consulta a un cache keyed por `userId` (`getVendorByUserId`).

Decisiones técnicas:

- `auth()` se ejecuta en cada request (no se elimina).
- La consulta a Prisma se memoiza con `cache(userId => ...)`, de forma que solo se comparten resultados entre llamadas que provienen del mismo `userId`.
- Esto evita la duplicación de consultas dentro de una misma renderización y evita fugas de datos entre usuarios.

Ejemplo (resumen):

```ts
// cacheada por userId
const getVendorByUserId = cache(async (userId: string) => {
   return prisma.vendor.findUnique({ where: { userId }, select: { id: true, name: true, address: true } })
})

export async function getVendorContext() {
   const { userId } = await auth()
   if (!userId) return { userId: null, vendor: null }
   const vendor = await getVendorByUserId(userId)
   return { userId, vendor }
}
```

Impacto esperado:

- menos consultas repetidas a Clerk y Prisma dentro del dashboard
- menos trabajo duplicado entre `dashboard/layout.tsx` y las páginas hijas
- menor tiempo de `application-code` en rutas como `overview`, `products` y `orders`

Revalidación e invalidación:

- En endpoints o server actions que muten datos de `vendor` (por ejemplo `createOrUpdateVendor`) es necesario invalidar o revalidar la cache por `userId` si los datos deben refrescarse inmediatamente. En Next.js puedes usar `revalidatePath()` para rutas afectadas y/o diseñar una estrategia TTL.


### 7. Reutilización del helper en server actions y rutas

Se actualizó el dashboard y las acciones de productos y órdenes para consumir el helper compartido.

Beneficios:

- una sola fuente de verdad para el vendor autenticado
- menos código repetido
- comportamiento consistente entre páginas y mutaciones

### 6. Configuración base de imágenes

Se ajustó `next.config.ts` para que el proyecto quede listo para optimización de imágenes con formatos modernos:

- AVIF
- WebP

No se migraron todavía componentes a `next/image` porque en esta base no había un consumidor visual de imágenes prioritario, pero la configuración ya queda preparada.

## Archivos tocados

- [seller-app/src/app/layout.tsx](../src/app/layout.tsx)
- [seller-app/src/app/globals.css](../src/app/globals.css)
- [seller-app/next.config.ts](../next.config.ts)
- [seller-app/src/app/api/products/route.ts](../src/app/api/products/route.ts)
- [seller-app/src/app/api/vendors/route.ts](../src/app/api/vendors/route.ts)
- [seller-app/src/app/dashboard/layout.tsx](../src/app/dashboard/layout.tsx)
- [seller-app/src/components/layout/DashboardSidebar.tsx](../src/components/layout/DashboardSidebar.tsx)
- [seller-app/src/components/ui/DashboardLoading.tsx](../src/components/ui/DashboardLoading.tsx)
- [seller-app/src/app/dashboard/loading.tsx](../src/app/dashboard/loading.tsx)
- [seller-app/src/app/dashboard/overview/loading.tsx](../src/app/dashboard/overview/loading.tsx)
- [seller-app/src/app/dashboard/products/loading.tsx](../src/app/dashboard/products/loading.tsx)
- [seller-app/src/app/page.tsx](../src/app/page.tsx)
- [seller-app/src/app/setup-vendor/page.tsx](../src/app/setup-vendor/page.tsx)
- [seller-app/src/app/dashboard/overview/page.tsx](../src/app/dashboard/overview/page.tsx)
- [seller-app/src/app/dashboard/products/page.tsx](../src/app/dashboard/products/page.tsx)
- [seller-app/src/app/dashboard/orders/page.tsx](../src/app/dashboard/orders/page.tsx)
- [seller-app/src/lib/vendor-context.ts](../src/lib/vendor-context.ts)
- [seller-app/src/app/actions/order.ts](../src/app/actions/order.ts)
- [seller-app/src/app/actions/product.ts](../src/app/actions/product.ts)
- [seller-app/src/app/dashboard/products/[id]/page.tsx](../src/app/dashboard/products/[id]/page.tsx)

## Cómo se alinea con Next.js oficial

- `next/font`: recomendado para optimizar carga de fuentes y evitar CLS.
- `loading.tsx`: patrón oficial para loading UI por segmento en App Router.
- `Cache-Control` en responses: ayuda a aprovechar caché HTTP cuando el contenido es estable.
- `next.config.ts` con formatos modernos: prepara la base para optimización de imágenes.
- layout y páginas como Server Components: mantenemos el render del servidor para evitar más JS del necesario.

## Qué no se hizo todavía

No se incluyó en esta entrega:

- migración completa a `next/image`
- estrategia de `generateMetadata()` por ruta dinámica
- clasificación fina entre SSG, ISR y SSR en cada ruta pública
- reemplazo total de estilos inline en formularios y componentes cliente
- paginación de órdenes y productos en dashboard
- desnormalización/carga parcial de campos pesados en overview y orders

Eso queda como siguiente fase si querés seguir profundizando la mejora.

## Validación recomendada

1. Ejecutar `npm run build` y revisar que `next/font` no introduce errores de build.
2. Ejecutar `npm run lint` para confirmar que las clases y componentes nuevos están consistentes.
3. Revisar en navegador:
   - home
   - setup-vendor
   - dashboard/overview
   - dashboard/products
   - dashboard/orders
4. Medir Lighthouse antes/después y comparar:
   - LCP
   - CLS
   - TBT/INP aproximado

## Próximos pasos sugeridos

1. Paginación o límite de órdenes en `getVendorOrders()` para bajar el costo del dashboard de pedidos.
2. Migrar las imágenes de producto a un componente basado en `next/image`.
3. Definir `generateMetadata()` para rutas dinámicas del dashboard.
4. Completar el reemplazo de estilos inline en formularios y páginas restantes.
5. Separar páginas estáticas e interactivas con estrategia explícita de caché y revalidate.
