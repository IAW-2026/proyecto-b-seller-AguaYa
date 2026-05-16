# AGENTS.md — AguaYa (Plataforma de Delivery de Agua de Mesa)

## Descripción general

AguaYa es una plataforma distribuida que centraliza la logística de compra, venta y distribución de agua de mesa (bidones). El sistema reemplaza la gestión informal (WhatsApp, Marketplace) con un conjunto de cinco WebApps independientes que se comunican entre sí mediante APIs REST. En este proyecto trabajaremos en la SellerApp, la cual es responsable de la logística de venta de agua de mesa (bidones).

---

## Arquitectura del sistema

El sistema está compuesto por **cinco aplicaciones independientes**, cada una con su propia base de datos y responsabilidades bien delimitadas:

| App | Responsable | Repositorio |
|-----|-------------|-------------|
| **BuyerApp** | Alvarez León | `proyecto-b-buyer-[Leon]` |
| **SellerApp** | Poza Agustin | `proyecto-b-seller-[AgustinP]` |
| **DeliveryApp** | Guttmann Jeremias | `proyecto-b-delivery-[Jeremias]` |
| **PaymentsApp** | Condorí Agustin | `proyecto-b-payments-[AgustinC]` |
| **FeedbackApp** | Plunkett Gregorio | `proyecto-b-feedback-[Gregorio]` |

---

## Autenticación

- El sistema usa **Clerk** como servicio centralizado de autenticación.
- Todos los usuarios se autentican a través de Clerk; la identidad se propaga entre servicios mediante **JWT**.
- Los roles se gestionan como `publicMetadata` en Clerk y vienen firmados en el token.

### Claims JWT universales

| Claim | Descripción |
|-------|-------------|
| `sub` | ID único del usuario en Clerk. Se mapea con `id_usuario` (FK) en cada base de datos local. |
| `role` | Tipo de actor. Habilita RBAC en cada app. |

### Roles disponibles

| Role | App principal | Descripción |
|------|--------------|-------------|
| `buyer` | BuyerApp | Explorar productos, crear pedidos, pagar, rastrear, reclamar, reseñar. |
| `seller` | SellerApp | Gestionar catálogo, stock, pedidos, despacho, rutas y facturas. |
| `delivery` | DeliveryApp | Ver pedidos asignados, iniciar ruta, actualizar estado, reportar incidentes. |
| `admin_seller` | SellerApp | Panel de control de vendedores. |
| `admin_buyer` | BuyerApp | Panel de control de compradores. |
| `admin_delivery` | DeliveryApp | Gestión de flota y logística. |
| `admin_feedback` | FeedbackApp | Moderación de reseñas y FAQs. |
| `admin_payment` | PaymentsApp | Administración de transacciones. |

> **Accesos cruzados:** Los usuarios con `role: "buyer"` también son aceptados por PaymentsApp y FeedbackApp, manteniendo una única sesión de Clerk.

---

## Modelo de datos por app

> Cada app tiene su propia base de datos. Las claves foráneas (`id_usuario`, `id_vendedor`, etc.) son el mecanismo de consistencia entre servicios. Nunca duplicar datos "duros" — solo almacenar el ID y consultar la fuente de verdad en tiempo real.

### BuyerApp
| Entidad | Atributos clave |
|---------|----------------|
| Cliente | `id_cliente` (PK), `id_usuario` (FK), mail, teléfonos, direcciones, nombre |
| Reclamo | `id_reclamo` (PK), `id_comprador` (FK), `id_pedido` (FK), `id_vendedor` (FK), justificación, foto, estado, fecha |
| Favoritos | `id_comprador` (FK), `id_vendedor` (FK) |
| Admin_Buyer | `id_admin` (PK), `id_usuario` (FK), nombre |

### SellerApp
| Entidad | Atributos clave |
|---------|----------------|
| Vendedor | `id_vendor` (PK), `id_usuario` (FK), nombre, reputación, cuil, cuit, descripción, dirección |
| Producto | `id_producto` (PK), `id_vendor` (FK), nombre, precio, stock, imagen, descripción |
| Pedido | `id_pedido` (PK), `id_vendor` (FK), `id_buyer`, snapshot_producto_nombre, snapshot_producto_precio, estado, fecha, monto, dirección |
| Admin_Vendor | `id_admin` (PK), `id_usuario` (FK), nombre |

### DeliveryApp
| Entidad | Atributos clave |
|---------|----------------|
| Chofer | `id_chofer` (PK), nombre, telefono, `id_vehiculo` (FK), estado |
| Vehículo | `id_vehiculo` (PK), patente, tipo, capacidad_bidones, `id_vendedor` (FK) |
| Ruta | `id_ruta` (PK), `id_chofer` (FK), `id_vendedor` (FK), fecha |
| Ruta_Pedido | `id_ruta` (PK/FK), `id_pedido` (PK/FK) |
| Admin_Delivery | `id_admin` (PK), `id_usuario` (FK), nombre |

### PaymentsApp
| Entidad | Atributos clave |
|---------|----------------|
| Transacción | `id_transaccion` (PK), `id_pedido` (FK), `id_comprador` (FK), `id_vendedor` (FK), monto, estado, modo_de_pago, fecha |
| Factura | `id_factura` (PK), `id_transaccion` (FK), monto, IVA, fecha |
| Admin_Payment | `id_admin` (PK), `id_usuario` (FK), nombre |

### FeedbackApp
| Entidad | Atributos clave |
|---------|----------------|
| Valoración | `id_valoracion` (PK), `id_pedido` (FK), estrellas, descripción, foto, fecha |
| FAQ | `id_faq` (PK), pregunta, respuesta, categoría |
| Admin_Feedback | `id_admin` (PK), `id_usuario` (FK), nombre |

---

## Estados posibles de un Pedido

Los estados son gestionados por **SellerApp** (fuente de verdad). PaymentsApp crea órdenes en estado `PAID` y el vendedor las transiciona a `READY`.

| Estado (enum) | Descripción | Quién lo setea |
|---------------|-------------|----------------|
| `PAID` | PaymentsApp confirmó el cobro. El vendedor ve la orden y prepara el pedido. | PaymentsApp via `POST /api/orders` |
| `READY` | El vendedor preparó el pedido y está listo para que DeliveryApp lo retire. | Vendedor via dashboard |

---

## APIs inter-servicios

La comunicación entre apps es exclusivamente mediante **HTTP REST**. No hay duplicación de datos; las apps consultan la fuente de verdad en tiempo real.

### BuyerApp expone

| Método | Endpoint | Consumidor | Descripción |
|--------|----------|-----------|-------------|
| GET | `/api/claims?client_ids=&order_ids=` | SellerApp | Retorna reclamos activos filtrados por IDs de clientes y pedidos. |
| POST | `/api/buyers/:buyer_id/payment-confirmed` | PaymentsApp | Notifica al comprador que su pago fue confirmado. |

### SellerApp expone

| Método | Endpoint | Consumidor | Descripción | Estado |
|--------|----------|-----------|-------------|--------|
| GET | `/api/orders/status/ready` | DeliveryApp | Lista pedidos en estado `READY`. | 🔄 TODO |
| GET | `/api/products` | BuyerApp | Lista productos activos con precio y stock. | 🔄 TODO |
| GET | `/api/vendors` | BuyerApp / FeedbackApp | Lista empresas activas con datos públicos. | ✅ IMPLEMENTADO |
| GET | `/api/vendors/:vendor_id` | BuyerApp / FeedbackApp | Detalle de un vendedor específico. | ✅ IMPLEMENTADO |
| GET | `/api/vendors?ids=1,2,3` | BuyerApp | Datos públicos de vendedores por IDs (favoritos). | ✅ IMPLEMENTADO |
| GET | `/api/orders/:order_id` | BuyerApp | Detalle completo de un pedido. | 🔄 TODO |
| GET | `/api/orders/:order_id/status` | BuyerApp | Estado actual de un pedido. | 🔄 TODO |
| POST | `/api/orders` | PaymentsApp | Recibe pedidos pagados desde PaymentsApp. Auth: `PAYMENTS_API_KEY`. | ✅ IMPLEMENTADO |
| POST | `/api/orders/:order_id/status/ready` | DeliveryApp | Marca una orden READY como entregada al delivery. | 🔄 TODO |

### DeliveryApp expone

| Método | Endpoint | Consumidor | Descripción |
|--------|----------|-----------|-------------|
| GET | `/api/roads/:driver_id` | SellerApp | Retorna el estado de ruta del chofer indicado. |
| PUT | `/api/ready_orders/:order_id` | SellerApp | Asigna un pedido listo a la logística. |

### PaymentsApp expone

| Método | Endpoint | Consumidor | Descripción |
|--------|----------|-----------|-------------|
| POST | `/api/checkout` | BuyerApp | Inicia el pago; retorna PreferenceID o link de Mercado Pago. |
| GET | `/api/status/:order_id` | FeedbackApp | Verifica si el pago de un pedido fue aprobado. |
| GET | `/api/payments/bills?order_id=` | SellerApp / BuyerApp | Retorna datos de facturación de un pedido. |

### FeedbackApp expone

| Método | Endpoint | Consumidor | Descripción |
|--------|----------|-----------|-------------|
| POST | `/api/feedback/reviews` | BuyerApp | Crea una reseña para un pedido. |

---

## Reglas de consistencia de datos

1. **Usuarios:** Base de datos centralizada. Cada app tiene una partición de la tabla de usuarios relacionada por `id_usuario` (FK). No duplicar email, teléfono u otros datos de identidad.

2. **Pedidos:** SellerApp es la **fuente de verdad**. Las demás apps (BuyerApp, DeliveryApp, PaymentsApp) actualizan su estado vía HTTP y nunca duplican la fila original.

3. **Favoritos y Reseñas:** BuyerApp y FeedbackApp solo almacenan `id_vendedor` (FK). Los datos del vendedor (nombre, descripción, etc.) se consultan en tiempo real a SellerApp mediante `GET /api/vendors/:vendor_id`.

---

## Flujo principal de uso (resumen)

1. **Buyer** explora el catálogo de vendedores y productos (consulta a SellerApp).
2. **Buyer** agrega al carrito y confirma la compra → BuyerApp inicia checkout en PaymentsApp.
3. **PaymentsApp** procesa el pago (Mercado Pago) y envía la orden a SellerApp via `POST /api/orders` (status `PAID`).
4. **Vendor** ve la orden en dashboard, la prepara y la marca como `READY`.
5. **DeliveryApp** consulta `GET /api/orders/status/ready` y retira los pedidos listos.
6. **Driver** entrega el pedido (gestión logística propia de DeliveryApp).
7. **Buyer** puede emitir una reseña en FeedbackApp (requiere validación de pago aprobado en PaymentsApp).

---

## Convenciones generales

- **Autenticación entre servicios:** Los endpoints que modifican estado sensible usan `X-API-Key` para autenticar a la app consumidora (ej: `PAYMENTS_API_KEY` para PaymentsApp).
- **No usar body en GETs:** Los endpoints GET pasan filtros por query parameters, nunca por body.
- **Snapshots en pedidos:** La tabla `Pedido` en SellerApp guarda `snapshot_producto_nombre` y `snapshot_producto_precio` para preservar el precio histórico al momento de la compra.
- **Comunicación asincrónica:** No existe mensajería de eventos (queues). Toda la comunicación es HTTP REST sincrónica entre apps.
