#!/bin/bash

# Tests manuales para endpoints de vendedores
# Uso: bash tests-vendors.sh

BASE_URL="http://localhost:3000"
API_KEY="buyer-secret-key-12345"

echo "=========================================="
echo "Tests: Endpoints de Vendedores"
echo "=========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local api_key=$4
  local expected_status=$5

  echo -e "${YELLOW}Test: $name${NC}"
  echo "URL: $BASE_URL$endpoint"
  
  if [ -z "$api_key" ]; then
    echo "Header: Sin X-API-Key"
    response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint")
  else
    echo "Header: X-API-Key: $api_key"
    response=$(curl -s -w "\n%{http_code}" -X $method \
      -H "X-API-Key: $api_key" \
      "$BASE_URL$endpoint")
  fi

  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)

  echo "Response Status: $status"
  echo "Response Body:"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  
  if [ "$status" == "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
  else
    echo -e "${RED}✗ FAIL (esperado: $expected_status, obtenido: $status)${NC}"
  fi
  echo ""
}

# Test 1: GET /api/vendors sin API key (401)
test_endpoint \
  "GET /api/vendors sin API key" \
  "GET" \
  "/api/vendors" \
  "" \
  "401"

# Test 2: GET /api/vendors con API key válida (200)
test_endpoint \
  "GET /api/vendors con API key válida" \
  "GET" \
  "/api/vendors" \
  "$API_KEY" \
  "200"

# Test 3: GET /api/vendors?ids=id1,id2 con API key válida (200)
# Nota: usar IDs reales de la BD
test_endpoint \
  "GET /api/vendors?ids=... con API key válida" \
  "GET" \
  "/api/vendors?ids=vendor-1,vendor-2" \
  "$API_KEY" \
  "200"

# Test 4: GET /api/vendors?ids= (IDs vacíos) (400)
test_endpoint \
  "GET /api/vendors?ids= (IDs vacíos)" \
  "GET" \
  "/api/vendors?ids=" \
  "$API_KEY" \
  "400"

# Test 5: GET /api/vendors/:vendor_id sin API key (401)
test_endpoint \
  "GET /api/vendors/vendor-1 sin API key" \
  "GET" \
  "/api/vendors/vendor-1" \
  "" \
  "401"

# Test 6: GET /api/vendors/:vendor_id con API key válida (200 o 404 si no existe)
test_endpoint \
  "GET /api/vendors/vendor-1 con API key válida" \
  "GET" \
  "/api/vendors/vendor-1" \
  "$API_KEY" \
  "200"

# Test 7: GET /api/vendors/:vendor_id inexistente (404)
test_endpoint \
  "GET /api/vendors/vendor-inexistente" \
  "GET" \
  "/api/vendors/vendor-inexistente" \
  "$API_KEY" \
  "404"

echo "=========================================="
echo "Tests completados"
echo "=========================================="
