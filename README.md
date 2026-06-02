# SellerApp — AguaYa

Aplicación **Seller** del [Proyecto IAW 2026](https://iaw-2026.github.io/proyecto/) — Tipo B (Delivery).

## Deploy

[https://proyecto-b-seller-agua-ya.vercel.app/](https://proyecto-b-seller-agua-ya.vercel.app/)

## Usuarios de prueba

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin (`admin_seller`) | admin_seller+clerk_test@iaw.com | iawuser# |
| Vendedor 1 (prueba con usuario ya creado) (`seller`) | seller+clerk_test@iaw.com | iawuser# |
| Vendedor 2 (prueba con usuario sin crear) (`seller`) | seller2+clerk_test@iaw.com | iawuser# |

El admin tiene acceso completo al panel de administración (gestión de vendedores, productos y órdenes globales).

## Instrucciones de uso

1. **Iniciar sesión** — Usar Clerk con Gmail (proveedor por defecto) o las credenciales de prueba.
2. **Dashboard** — Al entrar, redirige según el rol: admin ve el listado de vendedores; seller ve su resumen.
3. **Gestión de productos (Seller)** — Ir a "Productos" para crear, editar, activar/desactivar y eliminar productos del catálogo propio. Cada producto tiene nombre, precio, stock, descripción e imagen (subida a Cloudinary).
4. **Gestión de productos (Admin_Seller)** — Ir a "Productos" editar y eliminar productos de todos los catalogos de todos los sellers.
4. **Órdenes entrantes (Seller)** — Ir a "Órdenes". Las órdenes llegan con estado `PAID` desde PaymentsApp. El vendedor las marca como `READY` cuando están listas para entregar. El panel se actualiza automáticamente cada 10s y muestra notificaciones del navegador cuando llegan órdenes nuevas.
4. **Órdenes entrantes (Admin_Seller)** — Ir a "Órdenes". Podemos ver las ordenes de todos los sellers, marcarlas como `PAID` o `READY`.
5. **Gestión de vendedores (admin)** — Ir a "Vendedores" para crear, editar, activar/desactivar y eliminar vendedores. Cada vendedor se asocia a un usuario de Clerk existente. Podemos acceder al resumen del vendedor, sus ordenes y productos desde aqui.
6. **Reseñas** — Las reseñas se consultan en tiempo real desde FeedbackApp y se muestran en el resumen del vendedor y en el detalle de cada vendedor (admin). Tenemos un boton que ridirige a FeedbackApp desde seller si queremos ver todas las reseñas asociadas a nuestro negocio.

## Descripción del proyecto

AguaYa es una plataforma distribuida que centraliza la logística de compra, venta y distribución de agua de mesa (bidones), reemplazando la gestión informal actual basada en WhatsApp y Marketplace. El sistema está compuesto por cinco aplicaciones web independientes (SellerApp, BuyerApp, DeliveryApp, PaymentsApp, FeedbackApp) que se comunican entre sí mediante APIs REST.

SellerApp es la aplicación responsable del vendedor. Permite gestionar el catálogo de productos, controlar el stock, visualizar y procesar pedidos entrantes (transicionándolos de `PAID` a `READY`), y exponer APIs públicas para que las demás apps del ecosistema consulten vendedores, productos y estados de órdenes. También incluye un panel de administración para gestionar todos los vendedores, productos y órdenes del sistema.

El frontend está construido con Next.js 16 App Router y React 19, con Server Components como default y Client Components solo donde se necesita interactividad. La autenticación se maneja con Clerk, la base de datos es PostgreSQL serverless (Neon) con Prisma ORM, y las imágenes se almacenan en Cloudinary. El dashboard incluye modo oscuro, auto-refresh de órdenes, notificaciones del navegador y búsqueda y paginación en todas las tablas.

## Notas para la corrección

- **Arquitectura de capas**: Separación clara entre presentación (`components/`), lógica (`lib/`) y datos (`lib/queries/` + Prisma). Las Server Actions en `app/actions/` orquestan operaciones mutantes del dashboard, mientras que las API Routes en `app/api/` exponen endpoints para comunicación inter-servicio autenticados con API keys.
- **Proyecciones públicas**: Los endpoints `/api/vendors` y `/api/products` usan `toPublicVendor()` y `toPublicProduct()` para filtrar datos sensibles (userId, CUIL/CUIT, timestamps internos) antes de exponerlos.
- **Soft-delete**: Tanto vendedores como productos usan `deletedAt` en lugar de borrado físico, lo que permite recuperación y mantiene la integridad referencial de órdenes históricas.
- **Snapshots en órdenes**: Los pedidos almacenan `productName` y `productPrice` al momento de la compra, preservando el precio histórico aunque el catálogo del vendedor cambie.
- **Idempotencia en POST /api/orders**: El endpoint verifica `externalId` único antes de crear una orden, manejando race conditions entre requests concurrentes de PaymentsApp.
- **Transacciones atómicas**: La creación de órdenes usa `prisma.$transaction` para asegurar que la orden, sus items y el decremento de stock se ejecuten como una sola unidad.
- **Seguridad inter-servicio**: Cada endpoint de API valida `X-API-Key` en el header. Las claves se configuran por variable de entorno y se validan contra el valor esperado.
- **Auto-refresh**: La página de órdenes usa un componente cliente que llama a `router.refresh()` cada 10s para re-ejecutar las Server Components y reflejar nuevas órdenes sin recarga manual. Se complementa con un notificador que muestra alertas del navegador.
- **Crawlers**: La app cuenta con robots.txt, ai.txt y sitemap.xml.
- **Limitaciones conocidas**: La sección de reseñas depende de FeedbackApp; si ese servicio no responde, se muestra vacía con un warning en consola. La paginación con búsqueda en admin/vendors trae hasta 500 usuarios de Clerk por página. No se llego a implementar una landing-page decente. Desde admin seller se pueden acceder a rutas como dashboard/overview que no se deberia. Los vendedores no tienen paginacion en la vista de productos. En la tabla de sellers de admin_seller, aparecen admin_sellers. Los loadings no matchean bien con el contenido.
