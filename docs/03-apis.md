# 1.3 — Diseño de APIs Inter-Servicios

> **Tipo B — Plataforma de Delivery**

Documentar cada endpoint que una app expone para ser consumido por otra app del sistema. Este contrato debe estar acordado por todos los integrantes antes de comenzar la Etapa 2.

---

## Buyer App — Endpoints expuestos

| Caso de Uso | Consultar Reclamos|
| :---- | :---- |
| **Endpoint** | HTTP GET /api/claims?client_ids=1,2&order_ids=3,4 |
| **Request***| El endpoint recibe las listas de IDs de clientes y de pedidos a través de parámetros en la URL (query parameters), sin utilizar Body.|
| **Response** | BuyerApp responde con los clientes que tengan un reclamo activo asociado a los IDs de esos pedidos.|
| **Comunicación** | SellerApp solicita a → Reclamos (BuyerApp) |

| Caso de Uso | Notificar pago confirmado (Al Comprador) |
| :---- | :---- |
| **Endpoint** | HTTP POST /api/buyers/:buyer_id/payment-confirmed |
| **Request***| El endpoint recibe los datos asociados a un pago exitoso procesado (order_id, buyer_id, transaction_id, monto).|
| **Response** | BuyerApp responde con la confirmación de recepción para actualizar la UI del cliente. |
| **Comunicación** | PaymentApp notifica a → Compradores (BuyerApp) |

---

## Seller App — Endpoints expuestos


| Caso de Uso | Consultar Pedidos Listos para entregar |
| :---- | :---- |
| **Endpoint** | HTTP GET /api/orders/status/ready |
| **Request** | El endpoint recibe la petición (de la DeliveryApp) para obtener la lista de pedidos que tengan el estado listo_para_despacho. |
| **Response** | SellerApp responde con un array de pedidos incluyendo: ID Pedido, Dirección, Nombre Comprador y Cantidad de Bidones. |
| Comunicación | DeliveryApp solicita a → Pedidos (SellerApp) |

| Caso de Uso | Visualizar Productos / Buscar Producto |
| :---- | :---- |
| **Endpoint** | HTTP GET /api/products |
| **Request** | El endpoint recibe la petición (de la BuyerApp) para obtener la lista de productos activos y precios. |
| **Response** | SellerApp responde con un JSON de productos, descripción, precio y stock. |
| Comunicación | BuyerApp solicita a → Productos (SellerApp) |

| Caso de Uso | Visualizar Empresas |
| :---- | :---- |
| **Endpoint** | HTTP GET /api/vendors |
| **Request** | El endpoint recibe la petición (de la BuyerApp) de la lista de empresas activas para la pantalla principal, o el detalle de una en particular. |
| **Response** | SellerApp responde con un JSON que contiene los datos públicos de los vendedores (nombre, reputación, descripción, dirección). |
| Comunicación | BuyerApp solicita a → Vendedores (SellerApp) |

| Caso de Uso | Consultar Estado Pedido |
| :---- | :---- |
| **Endpoint** | HTTP GET /api/orders/:order_id/status |
| **Request** | El endpoint recibe el ID del pedido a consultar. |
| **Response** | SellerApp responde con el estado actual del pedido (ej. preparando, en_camino, entregado). |
| Comunicación | BuyerApp solicita a → Pedidos (SellerApp) |

| Caso de Uso | Consultar Pedido |
| :---- | :---- |
| **Endpoint** | HTTP GET /api/orders/:order_id |
| **Request** | El endpoint recibe el ID exacto del pedido a consultar a través de la URL. |
| **Response** | SellerApp responde con un JSON que contiene el detalle completo de ese pedido (productos, montos, estado actual y fechas). |
| Comunicación | BuyerApp solicita a → Pedidos (SellerApp)|

| Caso de Uso | Consultar favoritos |
| :---- | :---- |
| **Endpoint** | HTTP GET /api/vendors?ids=1,2,3 |
| **Request** | El endpoint recibe los IDs de los vendedores guardados en la partición local de la BuyerApp. |
| **Response** | SellerApp responde con los datos públicos correspondientes a los ids recibidos. |
| **Comunicacion** | BuyerApp solicita a → Vendedores (SellerApp) |

| Caso de Uso | Consultar datos del Vendedor para la Reseña |
| :---- | :---- |
| **Endpoint** | HTTP GET /api/vendors/:seller_id |
| **Request** | El endpoint recibe el ID del vendedor para obtener su información básica pública. |
| **Response** | SellerApp responde con informacion del vendedor. |
| **Comunicacion** | FeedbackApp solicita a → Vendedores (SellerApp) |

| Caso de Uso | Indicar Inicio Ruta de Entrega Pedido |
| :---- | :---- |
| **Endpoint** | HTTP POST /api/orders/:order_id/delivery-started |
| **Request** | El endpoint recibe el ID del repartidor asignado, el tiempo estimado de llegada y un token de autenticación de servicio en el Header. |
| **Response** | SellerApp procesa el inicio de ruta, actualizando el estado del pedido a "en_camino" y descontando el stock físico. |
| **Comunicacion** | DeliveryApp notifica a → Pedidos (SellerApp) |

| Caso de Uso | Notificar pago confirmado (Al Vendedor) |
| :---- | :---- |
| **Endpoint** | HTTP POST /api/orders/:order_id/payment-confirmed |
| **Request** | El endpoint recibe los datos del pago exitoso (transaction_id, monto) junto con credenciales de servicio (ej. X-Service-Token) para asegurar que la petición viene de PaymentApp. |
| **Response** | SellerApp procesa los datos y responde con una confirmación de actualización de la orden a pagado. |
| **Comunicacion** | PaymentApp notifica a → Pedidos (SellerApp) |

| Caso de Uso | Actualizar Estado de Pedido |
| :---- | :---- |
| **Endpoint** | HTTP PUT /api/orders/:order_id/delivery-status |
| **Request** | El endpoint recibe el nuevo estado del paquete (Ej. "entregado") actualizado por la flota. |
| **Response** | SellerApp procesa el cambio logístico y envía una confirmación de actualización. |
| **Comunicacion** | DeliveryApp actualiza en → Pedidos (SellerApp) |

| Caso de Uso | Modificar Estado de Pedido (Incidente) |
| :---- | :---- |
| **Endpoint** | HTTP PUT /api/orders/:order_id/incident |
| **Request** | El endpoint recibe el motivo exacto de la falla logística (Ej: "cliente ausente") reportado por el repartidor. |
| **Response** | SellerApp procesa el incidente, actualiza el estado del pedido a "fallido" y envía una confirmación. |
| **Comunicacion** | DeliveryApp actualiza en → Pedidos (SellerApp) |

---

## Delivery App — Endpoints expuestos


| Caso de Uso | Consultar Estados de Viajes |
| :---- | :---- |
| **Endpoint** | HTTP GET /api/roads/:driver_id |
| **Request** | El endpoint recibe el ID del vendedor que desea monitorear sus envíos. |
| **Response** | DeliveryApp responde con la ruta de cada vehículo asociado a ese ID. |
| **Comunicacion** | SellerApp solicita a → Estado de Viajes / Rutas (DeliveryApp) |

| Caso de Uso | Asignar Pedidos Listos |
| :---- | :---- |
| Endpointd | HTTP PUT /api/ready_orders/:order_id |
| **Request** | El endpoint recibe el ID del vendedor y los IDs de los pedidos específicos que están listos para entregar. |
| **Response** | DeliveryApp confirma la recepción de los pedidos asignados y actualiza su estado logístico interno. |
| **Comunicacion** | SellerApp asigna a → Rutas/Pedidos Listos (DeliveryApp) |




---

## Payments App — Endpoints expuestos

| Caso de Uso | Confirmar Compra / Checkout |
| :---- | :---- |
| **Endpoint** | HTTP POST /api/checkout |
| **Request** | El endpoint recibe el ID del usuario y el monto total del carrito para generar el pago. |
| **Response** | PaymentApp procesa y responde con el PreferenceID o link de Mercado Pago para abonar. |
| **Comunicacion** | BuyerApp envía a → Transacciones (PaymentApp) |

| Caso de Uso | Validar Pago para habilitar Reseña |
| :---- | :---- |
| **Endpoint** | HTTP GET /api/status/:order_id |
| **Request** | El endpoint recibe el ID del pedido para verificar en la base de datos si la transacción fue abonada. |
| **Response** | PaymentApp responde con el estado actual de ese pago (ej. "approved", "pending"). |
| **Comunicacion** | FeedbackApp consulta a → Transacciones (PaymentApp) |

| Caso de Uso | Consultar Factura |
| :---- | :---- |
| **Endpoint** | HTTP GET /api/payments/bills?order_id=123 |
| **Request** | El endpoint recibe el ID del pedido mediante parámetros en la URL (query parameters) para consultar su recibo fiscal. |
| **Response** | PaymentApp responde con un JSON con los datos de facturación (monto, IVA, fecha) asociados a ese pedido. |
| **Comunicacion** | SellerApp o BuyerApp solicitan a → Facturas (PaymentApp) |

---

## Feedback App — Endpoints expuestos *(si aplica)*


| Caso de Uso | Validar Pago para habilitar Reseña |
| :---- | :---- |
| **Endpoint** | HTTP GET /api/payments/status/:order_id |
| **Request***| FeedbackApp envía el ID del pedido para verificar si el pago está aprobado |
| **Response** | PaymentApp responde con el estado del pago (approved, pending, etc.). |
| **Comunicación** | FeedbackApp → Transacciones(PaymentApp) |

| Caso de Uso | Consultar datos del Vendedor para la Reseña |
| :---- | :---- |
| **Endpoint** | HTTP GET /api/seller/vendors/:seller_id |
| **Request***| FeedbackApp solicita información básica del vendedor usando su ID. |
| **Response** | SellerApp responde con el nombre comercial y rubro del vendedor. |
| **Comunicación** | Consultar datos del Vendedor para la Reseña → Vendedores (SellerApp). |

| Caso de Uso | Postear/Eliminar Reseña(Propia) |
| :---- | :---- |
| **Endpoint** | HTTP POST /api/feedback/reviews |
| **Request***| BuyerApp envía el ID del pedido, puntuación y texto. |
| **Response** | FeedbackApp confirma el guardado y lo vincula al historial de SellerApp. |
| **Comunicación** | Postear/Eliminar Reseña → Pedido (SellerApp). |


---
<br><br>

## Aclaraciones:

**Los estados posibles para un pedido son:**

**-listo_para_despacho:** El pedido ya fue preparado físicamente en el local del vendedor y está a la espera de que el sistema logístico (DeliveryApp) lo asigne a un chofer.

**-en_camino:** El repartidor ya tiene el pedido en su vehículo y ha iniciado la ruta hacia el domicilio del comprador.

**-entregado:** El pedido llegó a manos del cliente y la transacción logística finalizó con éxito.

**-fallido:** Ocurrió un incidente reportado por el chofer (ej. cliente ausente, dirección incorrecta) que impidió la entrega exitosa del pedido.

**-pendiente_pago:** El cliente ya confirmó el carrito y generó el pedido, pero la transacción aún no fue procesada o aprobada por la PaymentApp.

**-pagado:** La PaymentApp procesó y aprobó el cobro exitosamente, y ya notificó al sistema del vendedor que la orden está saldada.

**-preparando:** El vendedor ya recibió la orden (y la confirmación de pago), y se encuentra físicamente armando o empaquetando los bidones en su depósito antes de avisarle a la logística.

<!-- Agregar secciones por cada integración adicional identificada -->
