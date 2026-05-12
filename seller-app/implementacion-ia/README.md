# Implementación: Sistema de Pedidos Entrantes

Bienvenido a la documentación e implementación del sistema para recibir pedidos desde la Buyer App.

## 📁 Contenido de esta carpeta

- **IMPLEMENTACION_PEDIDOS.md** — Documentación completa con decisiones, justificaciones y especificación técnica.
- **.env.example** — Variables de entorno requeridas.
- **tests-manual.sh** — Script de pruebas con curl para validar el endpoint.

## 🚀 Próximos Pasos

### ✅ 1. Migración Ejecutada

La migración `add_externalId_to_order` fue ejecutada exitosamente. El campo `externalId` ahora es:
- ✅ Obligatorio (`NOT NULL`)
- ✅ Único (`UNIQUE` constraint)

La BD fue reseteada, eliminando órdenes previas sin `externalId`.

### ✅ 2. Configuración Completada

El `.env` ya tiene las variables necesarias:
- `DATABASE_URL` ✅
- Añadí `BUYER_API_KEY` al `.env` existente ✅

### 3. Iniciar el Servidor

```bash
npm run dev
```

Si todo está bien, no debe haber errores de compilación TypeScript.

### 4. Probar el Endpoint

Opción A: Usar el script de pruebas automáticas:

```bash
bash implementacion-ia/tests-manual.sh
```

Opción B: Prueba manual con curl:

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "X-API-Key: buyer-secret-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "test-001",
    "vendorId": "ven-abc",
    "buyerId": "buyer-xyz",
    "items": [{"productId": "prod-1", "quantity": 1}],
    "total": 100.00
  }'
```

Esperar respuesta como:

```json
{
  "success": true,
  "orderId": "ord-123",
  "externalId": "test-001",
  "status": "PENDING",
  "total": 100.00
}
```

## 📖 Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | Añadir campo `externalId String? @unique` al modelo `Order`. |
| `src/lib/validation.ts` | Añadir función `validateCreateOrderInput()` y interfaz `CreateOrderInput`. |
| **Nuevo:** `src/app/api/orders/route.ts` | Endpoint `POST /api/orders` con lógica completa. |

## 🔍 Validación Checklist

- [ ] Migración ejecutada sin errores (`npx prisma migrate dev`).
- [ ] Variable `BUYER_API_KEY` configurada en `.env.local`.
- [ ] Servidor iniciado sin errores TypeScript (`npm run dev`).
- [ ] Endpoint responde a `POST http://localhost:3000/api/orders`.
- [ ] Request sin API key devuelve 401.
- [ ] Request con API key correcta devuelve 201 (nueva orden) o 200 (existente).
- [ ] Idempotencia funciona: reenviar mismo `externalId` devuelve 200 + misma orden.
- [ ] Stock se decrementa después de crear orden.
- [ ] Validaciones rechazan payloads inválidos (400).

## 🔐 Seguridad en Producción

Antes de deployar a producción, revisar:

1. **API Key:** Cambiar `BUYER_API_KEY` por un valor seguro (ej. UUID).
2. **CORS:** Limitar a origen de Buyer App (si está en frontend).
3. **Rate Limiting:** Implementar en middleware (ver `IMPLEMENTACION_PEDIDOS.md` sección 9).
4. **Logging:** Revisar que los logs de auditoría están activos.
5. **Database:** Confirmar que las migraciones se ejecutaron en BD de producción.

## 📚 Documentación

Para más detalles sobre:

- Decisiones de diseño y justificaciones
- Especificación técnica completa del endpoint
- Modelos de request/response
- Tests y observabilidad
- Limitaciones y próximos pasos

👉 Revisar **IMPLEMENTACION_PEDIDOS.md**

## ⚠️ Posibles Errores

### Error: "BUYER_API_KEY no configurada"

**Solución:** Añadir `BUYER_API_KEY=...` a `.env.local`.

### Error de migración: "column 'externalId' already exists"

**Solución:** La migración ya fue ejecutada o aplicada. Verificar con:

```bash
npx prisma migrate status
```

### Request devuelve 401 aunque API key es correcta

**Solución:** Verificar que:
- El valor de `BUYER_API_KEY` en `.env.local` coincida exactamente.
- El header `X-API-Key` en el curl/request coincida.
- Reiniciar servidor (`Ctrl+C`, `npm run dev`).

## 🤝 Soporte

Si encuentras problemas:

1. Revisar los logs del servidor (`npm run dev` en terminal).
2. Consultar la especificación en **IMPLEMENTACION_PEDIDOS.md**.
3. Revisar el checklist de validación arriba.
4. Ejecutar script de pruebas: `bash tests-manual.sh`.

---

**¡Listo!** La implementación está completa. Sigue los pasos arriba y notifica cuando hayas validado el endpoint.
