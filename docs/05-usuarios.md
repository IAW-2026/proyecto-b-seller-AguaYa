# 1.5 — Usuarios Compartidos

> **Tipo B — Plataforma de Delivery**

El sistema utiliza **Clerk** como servicio centralizado de autenticación. Los usuarios se autentican a través de Clerk independientemente de qué app estén usando, y la identidad se propaga entre servicios mediante el token JWT emitido por Clerk.

---

## ¿Qué apps comparten usuarios?


| Usuario | Apps que utiliza |
| :---- | :---- |
| Vendedor, Admin.Vendedor | SellerApp. |
| Cliente, Admin. Comprador | BuyerApp. |
| Chofer, Admin. Chofer | DeliveryApp. |
| Admin. Reseñas | FeedbackApp |
| Admin. Pagos | PaymentApp |
<!-- Definir claramente qué roles de usuario existen y en qué apps pueden autenticarse. Un mismo usuario de Clerk puede tener acceso a más de una app. -->

---

## Claims del JWT relevantes por app

Claims universales: 

sub (Subject / User ID): El ID único del usuario en Clerk. Este claim es vital para todas las apps, ya que se mapea directamente con el atributo id_usuario(FK) que persiste en cada base de datos local (ej. para saber qué usuario está haciendo la petición y ver si este tiene vinculado un rol existente).


role (Rol del usuario): Define el tipo de actor (comprador, vendedor, chofer, admin_buyer, admin_seller, etc.).
Relevancia: Permite el control de acceso basado en roles (RBAC). Por ejemplo, la SellerApp validará que el role sea vendedor para permitir agregar un producto al catálogo, o rechazará la petición si el role es comprador.


<!-- Definir si los roles se gestionan como metadata en Clerk (publicMetadata) o de otra forma. -->

---

## Estrategia de roles

Para definir si un usuario es comprador, vendedor, repartidor o administrador, tomamos la opcion de usar Metadata en Clerk. Esto es asi ya que el rol viene asignado o firmado en el token.

| Aplicacion | Tipos de usuario |
| :---- | :---- |
| SellerApp | Puede tener usuarios de vendedores (role: “seller”) o administradores (role: “admin\_seller”) |
| BuyerApp | Puede tener usuarios de compradores ( role:”buyer” ) o administradores ( role: “admin\_buyer”) |
| DeliveryApp | Puede tener usuarios de compradores ( role:”delivery” ) o administradores ( role: “admin\_delivery”) |
| FeedbackApp | Puede tener usuarios administradores( role: “admin\_feedback”) |
| PaymentApp | Puede tener usuarios administradores ( role: “admin\_payment”) |

**Especificaciones de los roles:**

1. **`role: "buyer"`**: Permite explorar productos de distintas empresas vendedoras, gestionar una lista de favoritos y crear pedidos. Además, habilita realizar pagos de sus compras, visualizar facturas, visualizar el estado de su pedido, iniciar reclamos y emitir reseñas sobre el servicio recibido.
     
2. **`role: "seller"`**: Habilita la gestión integral de productos y el control de stock. Permite visualizar los pedidos entrantes, marcarlos como "Listos para despacho" para asignarlos a la logística, monitorear el estado de las rutas de sus repartidores, consultar facturas de ventas y leer las valoraciones/reseñas que dejan sus clientes.

     
3. **`role: "delivery"`**: Permite acceder a los pedidos asignados listos para entregar y visualizar las rutas correspondientes. Habilita la notificación del inicio de ruta (con tiempo estimado de llegada) y la actualización del estado del pedido, ya sea a "En camino", "Entregado" o reportar incidentes que cambien el estado a "Fallido" (ej: Cliente ausente).
  
     
4. **`role: "admin_*"`**: Roles específicos para los paneles de control de cada responsable de aplicación.


<!-- Describir cómo se define si un usuario es comprador, vendedor, repartidor o administrador.
Opciones comunes:
- Metadata en Clerk: `publicMetadata.role = "buyer" | "seller" | "courier" | "admin"`
- Organización separada por tipo de usuario en Clerk
- Roles gestionados localmente en cada app
-->
