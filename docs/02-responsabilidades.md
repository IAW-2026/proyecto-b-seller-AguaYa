# 1.2 — Asignación de Responsabilidades

> **Tipo B — Plataforma de Delivery**

## Distribución de webapps

| App | Responsable | Repositorio |
|-----|-------------|-------------|
| Buyer App | Alvarez León | `proyecto-b-buyer-[Leon]` |
| Seller App | Poza Agustin | `proyecto-b-seller-[AgustinP]` |
| Delivery App | Guttmann Jeremias | `proyecto-b-delivery-[Jeremias]` |
| Payments App | Condorí Agustin | `proyecto-b-payments-[AgustinC]` |
| Feedback App | Plunkett Gregorio | `proyecto-b-feedback-[Gregorio]` |

---

## Datos propios de cada app

### Buyer App
<!-- Entidades que viven en la base de datos de esta app -->
- Clientes
- Reclamos (Tabla original)
- Pedidos (Particion de la tabla pedidos) (pedido - orden de compra)
- Favoritos (Particion de la tabla original vendedores)
- Admin Buyer
### Seller App
<!-- Entidades que viven en la base de datos de esta app -->
- Vendedores
- Productos
- Pedidos (Tabla original)
- Reclamos (Particion de la tabla original)
- Admin Seller


### Delivery App
<!-- Entidades que viven en la base de datos de esta app -->
- Viajes
- Rutas
- Choferes
- Pedidos listos para entregar (Particion de la tabla original)
- Vehiculos
- Admin de Logistica

### Payments App
<!-- Entidades que viven en la base de datos de esta app -->
- Transacciones (orden de pago)
- Facturas
- Admin Payment

### Feedback App 
<!-- Entidades que viven en la base de datos de esta app -->
- Valoraciones (Estrellas y Comentarios)
- FAQs
- Admin Feedback

---

## Datos o acciones que requieren comunicación entre apps

| App origen | Acción / dato necesario | App destino | API involucrada |
|------------|------------------------|-------------|-----------------|
| Seller App | Consultar Reclamos | Buyer App | Clientes - Pedidos |
| Seller App | Consultar Reseñas | Feedback App | Valoraciones |
| Seller App | Consultar Estado de Viajes | Delivery App | Estado de Viajes |
| Seller App | Consultar Factura de pedido | Payment App | Facturas |
| Seller App | Asignar Pedidos del Listos | Delivery App | Pedidos Listos |
| Buyer App | Visualizar Empresas | Seller App | Vendedores |
| Buyer App | Visualizar Productos | Seller App | Producto |
| Buyer App | Consultar FAQs | Feedback App | FAQs |
| Buyer App | Consultar Factura | Payment App | Facturas |
| Buyer App | Buscar Producto | Seller App | Producto |
| Buyer App | Visualizar Reseñas | Feedback App | Vendedor - Reseña |
| Buyer App | Confirmar Compra | Payment App| Transacciones - Facturas |
| Buyer App | Iniciar Pago | Payment App | Transacciones - Checkout |
| Buyer App | Consultar estado de pedido | Seller App | Pedido |
| Buyer App | Consultar Favoritos | Seller App | Vendedor |
| Payment App | Notificar Pago Confirmado | Seller App | Vendedores |
| Payment App | Notificar Pago Confirmado | Buyer App | Compradores |
| Delivery App | Consultar Pedidos Listos para entregar | Seller App | Pedidos |
| Delivery App | Actualizar Estado de Envio | Seller App | Pedidos |
| Delivery App | Indicar Inicio de ruta de entrega Pedido | Seller App | Pedidos |
| Delivery App | Modificar Estado de Pedido | Seller App | Pedidos |
| Feedback App | Postear/Eliminar Reseña | Seller App | Pedido |
| Feedback App | Validar pago para habilitar reseña | Payment App | Transacciones |
| Feedback App | Consultar datos Vendedor para la reseña | Seller App | Vendedores |
