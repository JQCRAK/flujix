#!/usr/bin/env bash
# run-tests.sh — Ejecuta la suite de pruebas del backend (Jest + Supertest)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Carga las variables del ambiente de pruebas
set -a
source "$ROOT_DIR/devops/environments/test.env"
set +a

# La suite de pruebas lee MONGO_URI_TEST para no tocar la BD de desarrollo
export MONGO_URI_TEST="$MONGO_URI"

echo "==> Ejecutando pruebas (BD: $MONGO_URI)..."
cd "$ROOT_DIR/backend"

if npm test; then
  echo "✅ Todas las pruebas pasaron."
else
  echo "❌ Hay pruebas fallidas. Revisa el reporte de Jest."
  exit 1
fi
