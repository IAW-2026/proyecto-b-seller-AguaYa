# Implementación: Rol `admin_seller` — ABM de Vendedores y Gestión Delegada

**Fecha:** Mayo 24, 2026  
**Estado:** Implementado  
**Propósito:** Permitir que usuarios con rol `admin_seller` administren vendedores, sus productos y órdenes desde un dashboard centralizado.

---

## 1. Resumen Ejecutivo

Se implementó un nuevo rol `admin_seller` en Clerk `public_metadata.roles[]` que permite:

- ✅ **Listar todos los vendedores** con datos de Clerk (nombre, email).
- ✅ **Crear vendedores** asignándolos a un Clerk user existente sin vendor.
- ✅ **Soft delete de vendedores** (desactivación con `deletedAt`).
- ✅ **Vendor detail** con 3 tabs: Overview, Products, Orders.
- ✅ **Gestión de productos** (listar, eliminar) de cualquier vendedor.
- ✅ **Gestión de órdenes** (cambiar estado PAID → READY) de cualquier vendedor.
- ✅ **Sidebar condicional** — link "Vendedores" visible solo para admins.

**Tiempo estimado de implementación:** ~6 horas (incluye auth, queries, actions, UI, documentación).

---

## 2. Decisiones de Diseño

### 2.1 Roles en Clerk, no en DB

**Decisión:** El rol `admin_seller` vive exclusivamente en `public_metadata.roles[]` de Clerk.

**Justificación:**
- ✅ Consistente con el sistema de roles existente (el webhook ya asigna `seller`).
- ✅ No requiere migración de DB, nuevo modelo ni relaciones.
- ✅ El JWT firmado por Clerk garantiza que el rol no puede ser manipulado por el cliente.
- ✅ Escalable: cualquier app del ecosistema puede leer los mismos claims.

**Acceso al rol:**
```typescript
// src/lib/auth-utils.ts
const roles = (sessionClaims?.public_metadata?.roles as string[]) || []
```

### 2.2 Admin no necesita Vendor propio

**Decisión:** Un admin puede operar sin tener un Vendor en DB.

**Justificación:**
- ✅ El admin no es un vendedor, es un administrador de la empresa.
- ✅ El dashboard layout fue modificado para no redirigir a `/setup-vendor` si es admin.
- ✅ Si admin no tiene vendor, redirige directamente a `/dashboard/admin/vendors`.

**Cambio en `dashboard/layout.tsx`:**
```typescript
if (!vendor && !isAdmin) redirect('/setup-vendor')
if (!vendor && isAdmin) redirect('/dashboard/admin/vendors')
```

### 2.3 Rutas Admin bajo `/dashboard/admin/`

**Decisión:** Las rutas admin están bajo `/dashboard/admin/*`, heredando el layout del dashboard.

**Justificación:**
- ✅ Sidebar unificado — admin ve los mismos links + "Vendedores".
- ✅ Sin crear un layout separado, reutiliza Suspense y estilos.
- ✅ Protección por rol en cada página (server-side check).

**Rutas:**
| Ruta | Descripción |
|------|-------------|
| `/dashboard/admin/vendors` | Lista de vendedores + acciones |
| `/dashboard/admin/vendors/new` | Formulario crear vendedor |
| `/dashboard/admin/vendors/[id]` | Detalle con 3 tabs |

### 2.4 Soft Delete para Vendedores

**Decisión:** Se agrega `deletedAt DateTime?` al modelo Vendor (soft delete).

**Justificación:**
- ✅ Consistente con Product que ya usa soft delete.
- ✅ Preserva datos históricos (órdenes referencian vendorId).
- ✅ Fácil reactivación: solo setear `deletedAt: null`.

**Schema:**
```prisma
model Vendor {
  deletedAt DateTime? // Soft delete: vendedor desactivado, datos preservados
}
```

### 2.5 Selector de Clerk User al Crear Vendedor

**Decisión:** Dropdown que lista Clerk users sin vendor, mostrando "Nombre (email)".

**Justificación:**
- ✅ Evita errores: no se puede asignar el mismo Clerk user a dos vendors.
- ✅ UX clara: el admin ve exactamente qué usuarios están disponibles.
- ✅ Usa `clerkClient().users.getUserList()` con paginación (limit 500).

**Flujo:**
1. `getAvailableClerkUsers()` → Clerk API + Prisma → solo users sin vendor.
2. Dropdown renderiza `<option value={id}>{name} ({email})</option>`.
3. Submit → `createVendorAsAdmin()` → Prisma create con ese `userId`.

### 2.6 Vendor Detail con Tabs (Client Component)

**Decisión:** `VendorDetailTabs` es un client component con 3 tabs.

**Justificación:**
- ✅ Interactividad: cambiar de tab sin recargar la página.
- ✅ Datos pre-fetcheados en el server component padre.
- ✅ Server actions para mutaciones (delete product, update order).

**Tabs:**
| Tab | Contenido | Acciones |
|-----|-----------|----------|
| Overview | Info del vendor + reseñas | — |
| Products | Tabla de productos | Eliminar (soft delete) |
| Orders | Órdenes PAID + READY | Confirmar como lista (PAID → READY) |

---

## 3. Estructura de Archivos

### Creados

```
src/
  ├── lib/
  │   └── auth-utils.ts                     [NUEVO] Helper getAuthRoles()
  │
  ├── actions/
  │   └── admin-vendor.ts                   [NUEVO] Server actions admin
  │
  ├── components/
  │   └── admin/
  │       ├── VendorDetailTabs.tsx           [NUEVO] Tabs cliente (Overview/Products/Orders)
  │       └── DeleteVendorButton.tsx         [NUEVO] Botón desactivar con confirmación
  │
  └── app/dashboard/admin/vendors/
      ├── page.tsx                           [NUEVO] Lista de vendedores
      ├── new/
      │   └── page.tsx                       [NUEVO] Formulario crear vendedor
      └── [id]/
          └── page.tsx                       [NUEVO] Vendor detail con tabs
```

### Modificados

| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | Agregar `deletedAt DateTime?` a Vendor |
| `src/lib/queries.ts` | Agregar `listAllVendors()`, `getVendorById()` |
| `src/components/layout/DashboardSidebar.tsx` | Agregar link "Vendedores" + iconos + prop `roles` |
| `src/app/dashboard/layout.tsx` | Permitir admins sin vendor |

---

## 4. Server Actions en `admin-vendor.ts`

Todas comienzan con `requireAdmin()` que verifica `roles.includes('admin_seller')`.

| Action | Input | Descripción |
|--------|-------|-------------|
| `getAvailableClerkUsers()` | — | Clerk users sin vendor |
| `getVendorsWithClerkInfo()` | — | Todos los vendors + datos Clerk |
| `getVendorWithClerkInfo(vendorId)` | vendorId | Vendor + datos Clerk |
| `createVendorAsAdmin(data)` | userId, name, address, ... | Crear vendor |
| `updateVendorAsAdmin(vendorId, data)` | vendorId + partial data | Editar vendor |
| `deleteVendorAsAdmin(vendorId)` | vendorId | Soft delete |
| `updateOrderStatusAsAdmin(orderId, status)` | orderId + PAID/READY | Cambiar estado |
| `createProductAsAdmin(vendorId, data)` | vendorId + product data | Crear producto |
| `updateProductAsAdmin(vendorId, productId, data)` | vendorId, productId + data | Editar producto |
| `deleteProductAsAdmin(vendorId, productId)` | vendorId, productId | Soft delete producto |

**Helper:**
```typescript
async function requireAdmin() {
  const roles = await getAuthRoles()
  if (!roles.includes('admin_seller')) throw new Error('No autorizado')
}
```

---

## 5. Autorización

| Ruta | Acceso | Mecanismo |
|------|--------|-----------|
| `/dashboard/overview` | `seller` con vendor | layout check |
| `/dashboard/products/*` | `seller` con vendor | layout check |
| `/dashboard/orders` | `seller` con vendor | layout check |
| `/dashboard/settings` | `seller` con vendor | layout check |
| `/dashboard/admin/vendors` | `admin_seller` | server-side role check |
| `/dashboard/admin/vendors/new` | `admin_seller` | server-side role check |
| `/dashboard/admin/vendors/[id]` | `admin_seller` | server-side role check |
| `/setup-vendor` | `seller` sin vendor | layout check |

**Nota:** La protección de rutas admin se hace en cada página (server component), no en el middleware. Esto permite mensajes de error más específicos y evita depender del pathname en el middleware.

---

## 6. Testing Manual

### 6.1 Asignar rol admin_seller en Clerk

1. Ir a Clerk Dashboard → Users → Seleccionar usuario.
2. Editar `public_metadata`:
   ```json
   { "roles": ["seller", "admin_seller"] }
   ```
3. Recargar la app → debe aparecer "Vendedores" en el sidebar.

### 6.2 ABM de Vendedores

1. Ir a `/dashboard/admin/vendors`.
2. Click "Nuevo vendedor".
3. Seleccionar un Clerk user del dropdown.
4. Completar datos y crear.
5. Verificar que aparece en la lista.
6. Click en el nombre → ver detail con tabs.
7. Volver y desactivar → verificar soft delete.

### 6.3 Gestión de Productos y Órdenes

1. Entrar a un vendor detail.
2. Tab Products → ver lista, eliminar producto.
3. Tab Orders → ver órdenes, confirmar como lista.

### 6.4 Admin sin Vendor

1. Crear un Clerk user nuevo (solo registrarse).
2. Asignarle `admin_seller` en Clerk Dashboard.
3. Iniciar sesión → debe redirigir a `/dashboard/admin/vendors`.
4. Verificar que el sidebar muestra "Vendedores".

---

## 7. Cronograma Realizado

| Fase | Descripción | Tiempo | Estado |
|------|------------|--------|--------|
| 1 | Schema: agregar `deletedAt` a Vendor | 15m | ✅ |
| 2 | Auth: `auth-utils.ts` + layout update | 30m | ✅ |
| 3 | Queries: `listAllVendors()`, `getVendorById()` | 15m | ✅ |
| 4 | Actions: `admin-vendor.ts` (12 server actions) | 1h | ✅ |
| 5 | Sidebar: link Vendedores + iconos lucide | 30m | ✅ |
| 6 | Vendors list page + DeleteVendorButton | 45m | ✅ |
| 7 | Create vendor form + Clerk user selector | 1h | ✅ |
| 8 | Vendor detail + VendorDetailTabs (3 tabs) | 1.5h | ✅ |
| 9 | Build, fix types, commit, push | 30m | ✅ |
| 10 | Documentación | 30m | ✅ |
| **Total** | | **~6h** | **✅ Completado** |

---

## 8. Consideraciones Futuras

### 8.1 Editar Vendedor
Agregar ruta `/dashboard/admin/vendors/[id]/edit` con formulario pre-cargado.

### 8.2 Reactivar Vendedor
Agregar opción para listar vendedores desactivados y reactivarlos.

### 8.3 Crear Producto como Admin
Actualmente el tab Products solo permite eliminar. Agregar modal/form para crear/editar productos.

### 8.4 Notificaciones al Confirmar Orden
Actualmente `updateOrderStatusAsAdmin` solo cambia el estado. Idealmente debería notificar a DeliveryApp y BuyerApp (similar a `confirmOrderForDelivery`).

### 8.5 Paginación de Clerk Users
Si hay 500+ Clerk users sin vendor, el selector puede saturarse. Implementar búsqueda virtualizada.

### 8.6 Admin Layout Independiente
Si el admin crece en features, considerar un layout separado con navegación específica para admins.

---

**Implementado por:** GitHub Copilot (opencode)  
**Fecha:** Mayo 24, 2026  
**Próximo:** Testing en producción + ajustes de UI.
