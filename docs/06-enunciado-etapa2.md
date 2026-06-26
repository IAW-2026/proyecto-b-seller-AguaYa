# Etapa 2 — Desarrollo Individual de la WebApp

## Objetivo

Cada integrante desarrolla su webapp de forma completamente aislada, como si fuera un producto independiente.

Al finalizar esta etapa, cada aplicación debe:

- Funcionar por sí sola.
- Tener datos de prueba propios.
- No depender del funcionamiento real de otras apps.

Las llamadas a APIs de otras webapps deben mockearse o simularse durante esta etapa.

Lo importante es respetar los contratos definidos en la Etapa 1.

---

# Stack Tecnológico Obligatorio

| Capa | Tecnología |
|------|------------|
| Frontend / Full-stack | Next.js |
| Base de datos | PostgreSQL (propia por app) |
| Autenticación | Clerk |
| Pagos (solo Payments App) | Mercado Pago Sandbox |
| Estilos | Tailwind CSS / Chakra UI / Bootstrap |
| ORM | Prisma / Knex / pg |
| Deploy | Vercel + Railway / Supabase / Neon / Vercel Postgres |

---

# Requisitos Obligatorios de la WebApp

## Frontend y Arquitectura

- Páginas reutilizables en Next.js.
- Componentes reutilizables.
- Estructura escalable y ordenada.

---

## API Propia

Cada app debe exponer sus propios endpoints REST.

Estos endpoints podrán ser usados por:

- Su frontend.
- Otras apps del ecosistema en la Etapa 3.

---

## Base de Datos

- PostgreSQL propia.
- Cada app es dueña de sus datos.
- No compartir base con otras apps.

---

## Autenticación

### Obligatorio

- Login / Logout para administradores.

### Según el dominio

- Login para usuarios finales si corresponde.

---

## Panel de Administración

Debe existir una zona administrativa que permita:

- Crear registros.
- Editar registros.
- Eliminar registros.
- Ver listados.
- Ver reportes básicos.

---

## Búsqueda y Paginación

Donde aplique:

- Buscador funcional.
- Paginación real.
- Parámetros en URL.

Ejemplo:

```txt
/products?page=2&search=notebook