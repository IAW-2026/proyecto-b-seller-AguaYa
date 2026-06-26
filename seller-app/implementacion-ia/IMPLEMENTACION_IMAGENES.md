# Implementación de Sistema de Imágenes (Provider-Agnostic)

**Fecha:** Mayo 16, 2026
**Estado:** ✅ IMPLEMENTADO

---

## Resumen

Se implementó un sistema de subida y visualización de imágenes desacoplado del proveedor de storage. Actualmente soporta **Cloudinary** (browser upload directo + server-side delete), con una arquitectura que permite cambiar a cualquier otro provider modificando una variable de entorno.

---

## Arquitectura

```
Browser (client)
  │
  ├── ImageUpload.tsx ─── file picker + preview
  │     │
  │     └── POST upload.cloudinary.com (unsigned preset)
  │           └── devuelve URL pública
  │
  └── ProductForm / VendorForm
        └── guarda URL en BD (Prisma)

Server (actions / API)
  │
  ├── lib/storage/index.ts ── factory según STORAGE_PROVIDER
  │     │
  │     ├── cloudinary.ts ─── upload (no usado server-side) + delete
  │     └── (futuro) s3.ts, azure.ts, etc.
  │
  └── actions/product.ts ─── deleteProduct: si tiene imagen, la elimina
```

### Flujo de subida

1. Usuario selecciona archivo en `ImageUpload.tsx`
2. Se sube directamente desde el browser a Cloudinary vía **unsigned upload preset** (sin pasar por el servidor)
3. Cloudinary devuelve `{ secure_url }`
4. Se guarda la URL en el estado del formulario
5. Al submit, la URL se persiste en Prisma (`Product.image` o `Vendor.image`)

### Flujo de eliminación

1. `deleteProduct` en server action verifica si existe `image`
2. Extrae el `public_id` de la URL de Cloudinary
3. Llama a `getDeleter()("products/abc123")` que hace `DELETE` via API REST de Cloudinary
4. Elimina el registro de Prisma

---

## Variables de Entorno (Cloudinary)

```env
# Públicas (accesibles desde el browser vía NEXT_PUBLIC_*)
NEXT_PUBLIC_STORAGE_PROVIDER=cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=tu_unsigned_preset

# Privadas (solo servidor, para delete via REST API)
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abc123def456
```

### Configuración requerida en Cloudinary

1. Crear cuenta en [Cloudinary](https://cloudinary.com)
2. Copiar **Cloud name** → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
3. En Settings → Upload → **Upload presets** → Crear **unsigned preset**
   - **Signing mode:** Unsigned
   - **Folder:** `products` o `avatars`
   - Copiar el nombre del preset → `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
4. En Settings → **API Keys** → Copiar API Key y API Secret

---

## Estructura de Archivos

```
src/lib/storage/
  ├── types.ts          ── Tipos comunes (UploadResult, StorageProvider)
  ├── cloudinary.ts     ── Implementación Cloudinary (upload, delete)
  └── index.ts          ── Factory (getUploader, getDeleter)

src/components/ui/
  └── ImageUpload.tsx   ── Componente React reutilizable

src/app/actions/
  ├── product.ts        ── deleteProduct ahora elimina imagen de Cloudinary
  └── vendor.ts         ── createOrUpdateVendor acepta image
```

---

## Componente ImageUpload

Propiedades aceptadas:

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `string` | `''` | URL actual (para preview inicial) |
| `onChange` | `(url: string) => void` | requerido | Callback al cambiar imagen |
| `folder` | `string` | `'products'` | Carpeta en Cloudinary para organización |
| `label` | `string` | `'Imagen'` | Label del campo |
| `accept` | `string` | `'image/*'` | Tipos de archivo aceptados |

### Estados

- **Vacío:** Muestra solo el botón de selección
- **Cargando:** Spinner + barra de progreso fake
- **Con imagen:** Preview + botón "Cambiar imagen"
- **URL manual:** Input de texto para pegar URL directamente
- **Error:** Texto en rojo (archivo muy grande, formato inválido, error de subida)

---

## Integración en Formularios

### ProductForm
- Reemplaza `<input name="image" />` por `<ImageUpload>` con `folder="products"`

### VendorForm
- Agrega `<ImageUpload>` con `folder="avatars"` para logo del negocio
- Maneja `cuil`, `cuit`, `image` como opcionales

### Settings Page
- Server component que obtiene el vendor via `getVendorContext()`
- Renderiza `VendorForm` con `initialData` del vendor actual
- Botón "Guardar" redirige a `/dashboard/settings`

---

## Visualización

### DashboardSidebar
- Si `vendor.image` existe: muestra `<Image>` con `className="rounded-full"` de 40x40
- Si no: muestra círculo con inicial del nombre (fallback)

### Products Page
- Cada producto muestra thumbnail de 64x64 si tiene imagen
- Diseño responsivo: imagen y datos en flex row

---

## Provider-Agnostic

El sistema usa un patrón **Factory**:

```typescript
// src/lib/storage/index.ts
export function getUploader(): UploadFunction {
  switch (process.env.STORAGE_PROVIDER) {
    case 'cloudinary': return cloudinaryUpload // no usado server-side
    default: return mockUpload
  }
}

export function getDeleter(): DeleteFunction {
  switch (process.env.STORAGE_PROVIDER) {
    case 'cloudinary': return cloudinaryDelete
    default: return mockDelete
  }
}
```

Para agregar un nuevo provider:
1. Crear `s3.ts` con `s3Upload(url)` y `s3Delete(publicId)`
2. Agregar el case en `index.ts`

---

## next.config.ts

Se agregó `remotePatterns` para permitir imágenes de Cloudinary:

```typescript
remotePatterns: [
  { protocol: 'https', hostname: 'res.cloudinary.com' },
]
```
