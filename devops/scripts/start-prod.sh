#!/usr/bin/env bash
# start-prod.sh — Levanta el backend en modo producción (NODE_ENV=production)
# y construye el frontend para ser servido por Nginx.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Carga las variables del ambiente de producción
set -a
source "$ROOT_DIR/devops/environments/prod.env"
set +a

echo "==> Construyendo frontend para producción..."
cd "$ROOT_DIR/frontend"
npm run build

echo "==> Iniciando backend Flujix en modo PROD (puerto $PORT)..."
cd "$ROOT_DIR/backend"
exec npm start
