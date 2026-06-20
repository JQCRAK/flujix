#!/usr/bin/env bash
# start-dev.sh — Levanta el backend en modo desarrollo (puerto 3001)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Carga las variables del ambiente de desarrollo
set -a
source "$ROOT_DIR/devops/environments/dev.env"
set +a

echo "==> Iniciando backend Flujix en modo DEV (puerto $PORT)..."
cd "$ROOT_DIR/backend"
exec npm run dev
