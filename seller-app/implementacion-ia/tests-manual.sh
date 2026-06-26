#!/bin/bash

# Script de pruebas manuales para endpoint POST /api/orders
# Requiere: curl, jq (opcional para formatear JSON)
# Uso: bash tests-manual.sh

set -e

# Configuración
API_KEY="buyer-secret-key-12345"  # Cambiar si modificas BUYER_API_KEY en .env
BASE_URL="http://localhost:3000"
ENDPOINT="$BASE_URL/api/orders"

echo "=== Pruebas Manuales: POST /api/orders ==="
echo ""

# Helper para imprimir y ejecutar curl
test_request() {
  local name=$1
  local data=$2
  local expected_status=$3

  echo "📝 Test: $name"
  echo "📤 Body:"
  echo "$data" | jq . 2>/dev/null || echo "$data"
  echo ""

  response=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
    -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$data")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  echo "📥 Response (Status: $http_code):"
  echo "$body" | jq . 2>/dev/null || echo "$body"
  echo ""

  if [ "$http_code" = "$expected_status" ]; then
    echo "✅ PASS: Esperado $expected_status, recibido $http_code"
  else
    echo "❌ FAIL: Esperado $expected_status, recibido $http_code"
  fi
  echo ""
  echo "---"
  echo ""
}

# Test 1: Request sin API key (debe fallar con 401)
echo "### Test 1: Sin API Key (debe fallar 401)"
response=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"externalId": "test-1"}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
echo "Status: $http_code"
echo "$body" | jq . 2>/dev/null || echo "$body"
if [ "$http_code" = "401" ]; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
fi
echo ""
echo "---"
echo ""

# Test 2: Request con API key incorrecta (debe fallar con 401)
echo "### Test 2: API Key incorrecta (debe fallar 401)"
response=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "X-API-Key: INVALIDA" \
  -H "Content-Type: application/json" \
  -d '{"externalId": "test-2"}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
echo "Status: $http_code"
echo "$body" | jq . 2>/dev/null || echo "$body"
if [ "$http_code" = "401" ]; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
fi
echo ""
echo "---"
echo ""

# Test 3: JSON inválido (debe fallar con 400)
echo "### Test 3: JSON inválido (debe fallar 400)"
response=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{invalid json}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
echo "Status: $http_code"
echo "$body" | jq . 2>/dev/null || echo "$body"
if [ "$http_code" = "400" ]; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
fi
echo ""
echo "---"
echo ""

# Test 4: Payload con campos faltantes (debe fallar con 400)
echo "### Test 4: Campos faltantes (debe fallar 400)"
test_request "Falta externalId" \
  '{"vendorId": "ven-1", "buyerId": "buy-1", "items": [], "total": 100}' \
  "400"

# Test 5: externalId vacío (debe fallar con 400)
echo "### Test 5: externalId vacío (debe fallar 400)"
test_request "externalId vacío" \
  '{"externalId": "", "vendorId": "ven-1", "buyerId": "buy-1", "items": [{"productId": "p1", "quantity": 1}], "total": 100}' \
  "400"

# Test 6: items vacío (debe fallar con 400)
echo "### Test 6: items vacío (debe fallar 400)"
test_request "items vacío" \
  '{"externalId": "test-6", "vendorId": "ven-1", "buyerId": "buy-1", "items": [], "total": 0}' \
  "400"

# Test 7: quantity no entero (debe fallar con 400)
echo "### Test 7: quantity con decimal (debe fallar 400)"
test_request "quantity decimal" \
  '{"externalId": "test-7", "vendorId": "ven-1", "buyerId": "buy-1", "items": [{"productId": "p1", "quantity": 1.5}], "total": 100}' \
  "400"

echo ""
echo "=== Notas para pruebas con datos reales ==="
echo ""
echo "1. Crear o preparar un Vendor en BD:"
echo "   - Acceder a la BD y crear un vendor con userId desde Clerk"
echo "   - Anotar su ID (ej. ven-abc123)"
echo ""
echo "2. Crear o preparar Productos en BD:"
echo "   - Asignar al vendor del paso 1"
echo "   - Anotar IDs de al menos 2 productos con stock > 0"
echo ""
echo "3. Crear una orden de prueba exitosa:"
echo ""
cat << 'EOF'
curl -X POST http://localhost:3000/api/orders \
  -H "X-API-Key: buyer-secret-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "buyer-order-001",
    "vendorId": "VEN_ID_AQUI",
    "buyerId": "buyer-xyz",
    "items": [
      {"productId": "PROD_ID_1", "quantity": 2},
      {"productId": "PROD_ID_2", "quantity": 1}
    ],
    "total": 250.00
  }'
EOF
echo ""
echo ""
echo "4. Probar idempotencia (reenviar el mismo externalId):"
echo "   → Debe devolver 200 OK con misma orden"
echo ""
echo "5. Verificar en BD:"
echo "   → SELECT * FROM \"Order\" WHERE \"externalId\" = 'buyer-order-001';"
echo "   → SELECT * FROM \"OrderItem\" WHERE \"orderId\" = 'ORD_ID';"
echo "   → SELECT stock FROM \"Product\" WHERE id IN ('PROD_ID_1', 'PROD_ID_2');"
echo ""
