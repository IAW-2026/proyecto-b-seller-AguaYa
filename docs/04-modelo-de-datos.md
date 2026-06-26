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

---

## Seller App

### Entidades principales


| Entidad | Atributos |
| ----- | ----- |
| Vendedor | id\_usuario(FK),id\_vendedor(PK), nombre, reputación, cuil, cuit, descripción, dirección |
| Producto | id\_producto(PK),id\_vendedor(FK), nombre, precio, stock, imagen, descripción |
| Pedido | id\_pedido(PK), id\_vendedor(FK), id\_comprador, snapshot_producto_nombre, snapshot_producto_precio, estado, fecha, monto |
| Admin\_Seller | id\_usuario(FK), id\_admin(PK), nombre |

---

## Delivery App

### Entidades principales

| Entidad | Atributos |
| ----- | ----- |
| Chofer | id\_chofer(PK), nombre, telefono, id\_vehiculo(FK), estado |
| Vehículo | id\_vehiculo(PK), patente, tipo, capacidad\_bidones, id\_vendedor(FK) |
| Ruta | id\_ruta(PK), id\_chofer(FK), id\_vendedor(FK), fecha |
| Ruta_pedido | id\_ruta(PK/FK), id\_pedido(PK/FK) |
| Admin\_Delivery | id\_usuario(FK), id\_admin(PK), nombre |
---

## Payments App

### Entidades principales


| Entidad | Atributos |
| ----- | ----- |
| Transacción | id\_transaccion(PK), id\_pedido(FK), id\_comprador(FK), id\_vendedor(FK), monto, estado, modo\_de\_pago, fecha |
| Facturas | id\_factura(PK), id\_transaccion(FK), monto, IVA, fecha |
| Admin\_Payment | id\_usuario(FK), id\_admin(PK), nombre |
---

## Feedback App 

### Entidades principales


| Entidad | Atributos |
| ----- | ----- |
| Valoración | id\_valoracion(PK), id\_pedido(FK), estrellas, descripción, foto, fecha |
| FAQ | id\_faq(PK), pregunta, respuesta, categoría |
| Admin\_Feedback | id\_usuario(FK), id\_admin(PK), nombre |

---
<br><br>


## Análisis de Inconsistencias y Estrategias de Resolución:
Dado que el sistema está distribuido en cinco WebApps independientes, los datos pueden presentar duplicidad e inconsistencias. Para mitigar esto, hemos definido las siguientes estrategias:

**1\. Entidad Usuarios (Cliente, Vendedor, Chofer, Admins):**

**Inconsistencia potencial:** Al ser un dato requerido por casi todas las aplicaciones, si cada app guardará los datos del usuario (email, teléfono, etc.), la modificación en una app desactualizaría a las demás.

**Estrategia:** Se utilizará una única base de datos centralizada de usuarios, donde cada aplicación tendrá una partición de la tabla. De esta manera, existe una única "Fuente de Verdad" para la identidad y credenciales, y las aplicaciones se relacionan con estos perfiles mediante su id\_usuario(FK).

**2\. Entidad Pedidos / Transacciones:**

**Inconsistencia potencial:** La SellerApp es la dueña de la tabla original de Pedidos, pero la BuyerApp mantiene una partición para el seguimiento, la DeliveryApp actualiza sus estados mediante asignaciones de rutas y la PaymentApp enlaza el pedido a una Transacción/Factura. Si la DeliveryApp entrega un pedido pero la SellerApp cae, los estados quedarían desincronizados.

**Estrategia:** Sincronización mediante APIs REST. Tal como se definió en el diseño de APIs, las aplicaciones no duplicarán la información dura del pedido, sino que se notificarán los cambios de estado mediante peticiones HTTP (por ejemplo, DeliveryApp enviando un PUT a SellerApp para actualizar el estado de envío, o PaymentApp enviando un POST cuando se confirma un pago).

**3\. Entidad Favoritos y Reseñas:**

**Inconsistencia potencial:** La BuyerApp guarda los vendedores favoritos del cliente vinculando el id\_vendedor. Si un vendedor cambia su nombre o descripción en la SellerApp, la BuyerApp podría mostrar datos viejos si los tuviera duplicados. Lo mismo ocurre con la FeedbackApp al mostrar a quién pertenece una reseña.

**Estrategia:** Las aplicaciones delegadas (BuyerApp y FeedbackApp) solo almacenan el ID (Clave Foránea) del vendedor. Cuando requieran mostrar la información detallada (nombre, producto, etc.), realizarán consultas GET a la API de la SellerApp (que contiene la fuente de verdad) en tiempo real, asegurando que siempre se muestre la información más reciente.
