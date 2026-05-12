# Implementación: Soft Delete para Productos

**Fecha:** Mayo 12, 2026  
**Estado:** Implementación completada  
**Propósito:** Permitir eliminar productos sin perder histórico de órdenes asociadas.

---

## 1. Resumen de Cambios

Se implementó **soft delete** (eliminación lógica) para productos. Cuando eliminas un producto:
- ❌ NO se borra de la BD (DELETE)
- ✅ Se marca con `deletedAt = NOW()` (UPDATE)
- ✅ Se preserva el histórico completo de órdenes

---

## 2. Cambios Realizados

### 2.1 Schema (prisma/schema.prisma)

**Agregado a Product:**
```prisma
deletedAt   DateTime?   // Soft delete
```

**Actualizado OrderItem:**
```prisma
product      Product @relation(fields: [productId], references: [id], onDelete: Cascade)
// Cascada es segura: productName y productPrice ya guardados en OrderItem
```

### 2.2 Server Actions (src/app/actions/product.ts)

**createProduct** — Sin cambios (no afectado)

**updateProduct** — Agregado filtro:
```typescript
where: {
  id: data.id,
  vendorId: vendor.id,
  deletedAt: null, // ← Solo editar no eliminados
}
```

**deleteProduct** — Cambiado a soft delete:
```typescript
// Antes: await prisma.product.delete()
// Ahora:
const deletedProduct = await prisma.product.update({
  where: { id: productId },
  data: {
    deletedAt: new Date(), // Marcar como eliminado
  },
})
```

### 2.3 API Endpoints

**src/app/api/orders/route.ts** (línea 99):
```typescript
const products = await prisma.product.findMany({
  where: { 
    id: { in: productIds },
    deletedAt: null, // ← Excluir soft-deleted
  },
})
```

**src/app/api/products/route.ts** (línea 85):
```typescript
const where: any = {
  deletedAt: null, // ← Excluir soft-deleted
  // ... resto de filtros
}
```

---

## 3. Beneficios de la Implementación

| Aspecto | Ventaja |
|--------|---------|
| **Historial** | Productos viejos siguen en BD, auditable |
| **Reportes** | Reportes históricos funcionan (productName, productPrice en OrderItem) |
| **Recuperación** | Fácil "undelete" actualizando `deletedAt = NULL` |
| **Integridad** | No viola foreign keys de OrderItem |
| **Performance** | Query con `deletedAt IS NULL` es rápida (index posible) |

---

## 4. Flujo de Uso

### Eliminación de Producto
```typescript
// Usuario elim ina producto en UI
await deleteProduct("prod-123")

// BD: UPDATE Product SET deletedAt = NOW() WHERE id = 'prod-123'
// Resultado: Producto marcado como eliminado pero preservado
```

### Listado de Productos (Automático)
```typescript
// GET /api/products (incluye solo no eliminados)
const where = { deletedAt: null }
// Retorna solo productos activos

// Crear orden (incluye solo no eliminados)
const where = { deletedAt: null }
// Evita que comprador elija producto eliminado
```

### Reportes de Órdenes Históricas
```typescript
// Reporte de orden completada (funciona siempre)
const orderItems = await prisma.orderItem.findMany({
  where: { orderId: "ord-123" }
  // Retorna: productName, productPrice (no depende de Product)
})

// Resultado: ✅ Funciona incluso si producto fue eliminado
```

---

## 5. Reversión (Si Fuera Necesario)

Para "undelete" un producto:
```typescript
// Actualizar campo deletedAt a NULL
await prisma.product.update({
  where: { id: "prod-123" },
  data: { deletedAt: null }
})
```

---

## 6. Escalabilidad Futura

### Índices Recomendados (Opcional)
```sql
-- Para queries rápidas de productos activos
CREATE INDEX idx_product_deleted ON "Product"(deletedAt);
CREATE INDEX idx_product_vendor_deleted ON "Product"(vendorId, deletedAt);
```

### Queries Comunes
```typescript
// Todos los productos activos de un vendor
await prisma.product.findMany({
  where: {
    vendorId: "ven-1",
    deletedAt: null,
  }
})

// Todos los productos (incluyendo eliminados)
await prisma.product.findMany({
  where: {
    vendorId: "ven-1",
    // No filtrar deletedAt (admin panel)
  }
})

// Solo productos eliminados
await prisma.product.findMany({
  where: {
    vendorId: "ven-1",
    deletedAt: { not: null },
  }
})
```

---

## 7. Testing Manual

### Prueba 1: Crear y Eliminar Producto
```typescript
// 1. Crear
const product = await createProduct({
  name: "Agua Purificada",
  price: 45.50,
  stock: 100
})
// → Resultado: product.id = "prod-abc123"

// 2. Verificar en API
// GET /api/products → Aparece en lista

// 3. Eliminar
await deleteProduct("prod-abc123")

// 4. Verificar en API
// GET /api/products → NO aparece en lista

// 5. Verificar en BD
SELECT deletedAt FROM "Product" WHERE id = 'prod-abc123'
// → deletedAt = 2026-05-12 15:30:45.123
```

### Prueba 2: Orden con Producto Eliminado
```typescript
// 1. Crear orden con producto
const order = await POST /api/orders
// → Funciona, productId existe y deletedAt IS NULL

// 2. Eliminar el producto
await deleteProduct("prod-abc123")

// 3. Reportar orden (histórico)
const orderItem = await prisma.orderItem.findFirst({
  where: { orderId: order.id }
})
// → productName, productPrice están intactos ✅
```

---

## 8. Notas Técnicas

- **Migración:** `npx prisma db push` ya ejecutada ✅
- **Schema:** `deletedAt DateTime?` es nullable (producto activo si NULL)
- **Cascade:** OrderItem delete cascara si producto se elimina, pero deleteAt preserva datos
- **Timestamps:** `deletedAt` se actualiza con `new Date()` (servidor local → asegúrate de TZ)

