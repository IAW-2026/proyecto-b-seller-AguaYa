# 1.4 — Modelo de Datos por Aplicación

> **Tipo B — Plataforma de Delivery**

Para cada webapp, describir las entidades principales de su base de datos: tablas, campos relevantes y relaciones. No es necesario un DER formal, pero sí que quede claro qué persiste cada app.

También identificar posibles duplicados entre apps (ej: usuarios) y definir cómo se resuelven las inconsistencias.

---

## Buyer App

### Entidades principales

| Entidad | Atributos |
| ----- | ----- |
| Cliente | id\_usuario(FK), id\_cliente(PK), mail, teléfonos, direcciones, nombre |
| Reclamo | id\_reclamo(PK), id\_comprador(FK), id\_pedido(FK), id\_vendedor(FK), justificación, foto, estado, fecha |
| Favoritos | id\_comprador(FK), id\_vendedor(FK) |
| Admin\_Buyer | id\_usuario(FK), id\_admin(PK), nombre |

> **Nota:** La entidad Pedido no vive en Buyer App. Los pedidos son consultados en tiempo real a Seller App vía `GET /api/orders/:orderId`.

---

## Seller App

### Entidades principales

| Entidad | Atributos |
| ----- | ----- |
| Vendedor | id\_usuario(FK), id\_vendedor(PK), nombre, reputación, cuil, cuit, descripción, dirección |
| Producto | id\_producto(PK), id\_vendedor(FK), nombre, precio, stock, imagen, descripción |
| Pedido | id\_pedido(PK), id\_vendedor(FK), id\_comprador(FK), estado, producto, fecha, monto |
| Factura | id\_factura(PK), id\_pedido(FK), monto, IVA, fecha |
| Admin\_Seller | id\_usuario(FK), id\_admin(PK), nombre |

> **Nota:** Seller App es la fuente de verdad de los pedidos. La Factura está asociada directamente al pedido y se devuelve como parte de `GET /api/orders/:orderId`. Las demás apps no duplican esta información sino que la consultan vía API.

---

## Delivery App

### Entidades principales

| Entidad | Atributos |
| ----- | ----- |
| Chofer | id\_chofer(PK), telefono, id\_vehiculo(FK), estado |
| Vehículo | id\_vehiculo(PK), patente, tipo, capacidad\_bidones, id\_vendedor(FK) |
| Ruta | id\_ruta(PK), id\_chofer(FK), id\_vendedor(FK), fecha |
| Ruta\_Pedido | id\_ruta(FK), id\_pedido(FK) *(tabla intermedia — pedidos asignados a una ruta)* |
| Pedido\_Listo | id\_pedido(FK), id\_vendedor(FK), fecha\_listo *(partición de la tabla original de Seller App — solo pedidos con estado "ready")* |
| Admin\_Delivery | id\_usuario(FK), id\_admin(PK), nombre |

> **Nota:** `Ruta_Pedido` reemplaza al campo `pedidos_asignados` que habría roto la normalización. `Pedido_Listo` es una partición sincronizada desde Seller App y no duplica el estado completo del pedido.

---

## Payments App

### Entidades principales

| Entidad | Atributos |
| ----- | ----- |
| Transacción | id\_transaccion(PK), id\_pedido(FK), id\_comprador(FK), id\_vendedor(FK), monto, estado, modo\_de\_pago, fecha |
| Admin\_Payment | id\_usuario(FK), id\_admin(PK), nombre |

> **Nota:** Las Facturas fueron movidas a Seller App, donde están asociadas directamente al Pedido. Payments App se limita a gestionar las transacciones (órdenes de pago) y delega la facturación a Seller App.

---

## Feedback App

### Entidades principales

| Entidad | Atributos |
| ----- | ----- |
| Valoración | id\_valoracion(PK), id\_pedido(FK), id\_comprador(FK), id\_vendedor(FK), estrellas, descripción, foto, fecha |
| FAQ | id\_faq(PK), pregunta, respuesta, categoría |
| Admin\_Feedback | id\_usuario(FK), id\_admin(PK), nombre |

> **Nota:** Se agregaron `id_comprador(FK)` e `id_vendedor(FK)` a Valoración. El `id_vendedor` se obtiene mediante un join cruzado con Seller App (`GET /api/sellers/:sellerId`) al momento de crear la reseña, a partir del `id_pedido`. Esto evita que Feedback App necesite mantener una copia de la relación vendedor-pedido.

---

## Análisis de Inconsistencias y Estrategias de Resolución

Dado que el sistema está distribuido en cinco WebApps independientes, los datos pueden presentar duplicidad e inconsistencias. Para mitigar esto, hemos definido las siguientes estrategias:

**1. Entidad Usuarios (Cliente, Vendedor, Chofer, Admins)**

**Inconsistencia potencial:** Al ser un dato requerido por casi todas las aplicaciones, si cada app guardara los datos del usuario (email, teléfono, etc.), la modificación en una app desactualizaría a las demás.

**Estrategia:** Se utilizará una única base de datos centralizada de usuarios, donde cada aplicación tendrá una partición de la tabla. De esta manera, existe una única "Fuente de Verdad" para la identidad y credenciales, y las aplicaciones se relacionan con estos perfiles mediante su `id_usuario(FK)`.

**2. Entidad Pedidos / Facturas**

**Inconsistencia potencial:** Seller App es la dueña de la tabla original de Pedidos y de las Facturas asociadas. Delivery App mantiene una partición (`Pedido_Listo`) y actualiza estados vía API. Buyer App y Feedback App solo consultan. Si Seller App cae, los estados podrían quedar desincronizados.

**Estrategia:** Sincronización mediante APIs REST. Las apps no duplican la información del pedido ni la factura; se notifican cambios de estado mediante peticiones HTTP (por ejemplo, Delivery App enviando `PUT /api/orders/:orderId/status` a Seller App). La factura se expone como parte del objeto pedido en `GET /api/orders/:orderId`, eliminando la necesidad de un endpoint separado.

**3. Entidad Favoritos y Reseñas**

**Inconsistencia potencial:** Buyer App guarda favoritos vinculando `id_vendedor`. Si un vendedor cambia nombre o descripción en Seller App, Buyer App podría mostrar datos desactualizados. Lo mismo aplica a Feedback App al mostrar a quién pertenece una reseña.

**Estrategia:** Las apps delegadas (Buyer App y Feedback App) solo almacenan el ID (Clave Foránea) del vendedor. Cuando necesiten mostrar información detallada, realizarán consultas GET a la API de Seller App en tiempo real, garantizando que siempre se muestre la información más reciente.

**4. Entidad Reclamos**

**Inconsistencia potencial:** Los reclamos viven en Buyer App, pero Seller App necesita consultarlos para gestionar disputas.

**Estrategia:** Seller App no replica los reclamos. Los consulta en tiempo real vía `GET /api/claims/:orderId` expuesto por Buyer App. Buyer App es la única fuente de verdad de esta entidad.
