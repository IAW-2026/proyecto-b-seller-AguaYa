# 1.1 — Descripción del Sistema

> **Tipo B — Plataforma de Delivery**

## ¿Qué problema resuelve?

Se identificó la necesidad de centralizar la logística integral de la compra, venta y distribución de agua de mesa. Esta necesidad surge debido a que tanto los integrantes de este grupo como allegados a nosotros, consumen el producto y han observado que la gestión logística actual se realiza mediante plataformas informales, como WhatsApp o Marketplace. Este esquema carece de funcionalidades esenciales, como el seguimiento del estado de los repartidores y la centralización de los métodos de pago (actualmente se requiere el envío de un comprobante por chat para validar la transferencia).

En consecuencia, la solución que proponemos consiste en una aplicación que centralice la logística. Esta plataforma permitirá al vendedor (Seller) crear un catálogo de productos, gestionar pedidos y coordinar envíos. Por su parte, el cliente (Buyer) podrá acceder a los catálogos de distintas empresas distribuidoras de agua, visualizar el seguimiento detallado de su pedido y emitir reseñas sobre el servicio.


## Actores del sistema

| Actor | Descripción | Apps donde interactúa |
|---|---|---|
| Vendedor | El vendedor es capaz de generar un catálogo de sus productos, poder visualizar un seguimiento de sus repartidores, también así mantener un control del stock de su empresa y de los bidones que debe cada cliente particular. | **SellerApp** (aquí subirá su catálogo y consultará las métricas de su negocio). **PaymentsApp** (La aplicación de pagos notificará cuando un pago se realizó exitosamente). **FeedbackApp** (aquí su negocio podrá visualizar sus reseñas). |
| Comprador | Es el consumidor que tiene una necesidad de agua potable. Utiliza la aplicación para consultar los proveedores, y solicitar un pedido de bidones de agua de forma conveniente y rápida. | **Buyer App** (va a poder visualizar el catálogo de productos, su carrito, y un seguimiento de sus pedidos). **PaymentApp** (notifica cuando el comprador realizó un pago). **FeedbackApp** (va a poder calificar la entrega del producto). |
| Repartidor | Es el eslabón logístico encargado de la distribución física. Utiliza la aplicación como herramienta de trabajo en campo para optimizar sus traslados, pudiendo ver los pedidos que se le asignaron, y confirmando o cancelando la entrega. | Delivery App, Payments App. |
| Administrador Seller | Gestiona el alta/baja de vendedores, modera el catálogo de productos y define categorías. | SellerApp (Panel de Control). |
| Administrador Buyer | Administra la base de usuarios, gestiona cupones de descuento y visualiza reportes de consumo global. | BuyerApp (Panel de Control). |
| Administrador Delivery | Gestiona la flota de vehículos, asigna zonas de cobertura y configura costos de envío. | DeliveryApp (Gestión de logística). |
| Administrador FeedBack | Moderador del sistema. Gestiona reclamos técnicos, responde FAQ y elimina comentarios indebidos. | FeedbackApp (Soporte y Moderación). |
| Administrador Payment | Moderador del sistma de pagos. Puede visualizar, editar o eliminar transacciones realizadas a traves de la app. | PaymentApp (Administracion de Pagos). |
 
## Flujo principal de uso


<img width="991" height="531" alt="Diagrama de flujo AquaDrop v1 " src="https://github.com/user-attachments/assets/2b9d2a9f-0bdd-4a81-806b-5a21b7dfd334" />

