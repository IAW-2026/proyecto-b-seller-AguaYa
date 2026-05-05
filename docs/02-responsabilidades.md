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
- Reclamos (tabla original — SellerApp solo puede consultarlos vía API)
- Favoritos (partición de vendedores)
- Admin Buyer

### Seller App
<!-- Entidades que viven en la base de datos de esta app -->
- Vendedores
- Productos
- Pedidos (tabla original — fuente de verdad)
- Facturas (asociadas al pedido)
- Admin Seller

### Delivery App
<!-- Entidades que viven en la base de datos de esta app -->
- Viajes
- Rutas
- Choferes
- Pedidos Listos para Entregar (tabla intermedia — partición de la tabla original de Seller App)
- Vehículos
- Admin de Logística

### Payments App
<!-- Entidades que viven en la base de datos de esta app -->
- Transacciones (orden de pago)
- Admin Payment

### Feedback App
<!-- Entidades que viven en la base de datos de esta app -->
- Valoraciones (estrellas y comentarios)
- FAQs
- Admin Feedback

---

## Datos o acciones que requieren comunicación entre apps

| App origen | Acción / dato necesario | App destino | API involucrada |
|------------|------------------------|-------------|-----------------|
| Seller App | Consultar Reclamos | Buyer App | Reclamos |
| Seller App | Consultar Reseñas | Feedback App | Valoraciones |
| Seller App | Consultar Estado de Viajes | Delivery App | Estado de Viajes |
| Seller App | Asignar Pedidos Listos | Delivery App | Pedidos Listos |
| Buyer App | Visualizar Empresas | Seller App | Vendedores |
| Buyer App | Visualizar Productos | Seller App | Productos |
| Buyer App | Consultar FAQs | Feedback App | FAQs |
| Buyer App | Consultar Factura de Pedido | Seller App | Pedidos (incluye factura) |
| Buyer App | Buscar Producto | Seller App | Productos |
| Buyer App | Visualizar Reseñas | Feedback App | Valoraciones |
| Buyer App | Confirmar Compra / Iniciar Pago | Payment App | Transacciones - Checkout |
| Buyer App | Consultar Estado de Pedido | Seller App | Pedidos |
| Buyer App | Consultar Favoritos | Seller App | Vendedores |
| Payment App | Notificar Pago Confirmado | Seller App | Pedidos |
| Payment App | Notificar Pago Confirmado | Buyer App | Compradores |
| Delivery App | Consultar Pedidos Listos para Entregar | Seller App | Pedidos |
| Delivery App | Actualizar Estado de Pedido | Seller App | Pedidos |
| Feedback App | Postear/Eliminar Reseña | Seller App | Pedidos |
| Feedback App | Validar Pago para Habilitar Reseña | Payment App | Transacciones |
| Feedback App | Consultar Datos del Vendedor para la Reseña | Seller App | Vendedores |
