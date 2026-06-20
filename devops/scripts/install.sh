#!/usr/bin/env bash
# install.sh — Instala dependencias de backend y frontend
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "==> Instalando dependencias del backend..."
cd "$ROOT_DIR/backend"
npm install

echo "==> Instalando dependencias del frontend..."
cd "$ROOT_DIR/frontend"
npm install

echo "✅ Instalación completa."
