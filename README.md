# 📋 Flujix — Sistema de Gestión de Tareas

Proyecto Integrador **DevOps + Verificación y Validación**.

Sistema web para gestionar tareas con estados (`pendiente`, `en_progreso`, `completado`) y prioridades (`baja`, `media`, `alta`), con pipeline de CI, pruebas automatizadas y despliegue detrás de Nginx.

## 🏗️ Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js + Express (puerto 3001) |
| Frontend | React 18 + Vite |
| Base de datos | MongoDB (`localhost:27017`) |
| Pruebas | Jest + Supertest |
| CI | GitHub Actions |
| Servidor | Nginx (reverse proxy) sobre Ubuntu |

## 📁 Estructura

```
flujix/
├── backend/          # API REST (Express + Mongoose)
│   ├── src/          # models/, routes/, controllers/, app.js
│   └── tests/        # task.test.js (14 casos: funcionales, negativos, borde)
├── frontend/         # SPA React (Vite)
│   └── src/components/   # TaskForm, TaskList, TaskCard
├── devops/
│   ├── environments/ # dev.env, test.env, prod.env
│   ├── scripts/      # install.sh, start-dev.sh, start-prod.sh, run-tests.sh
│   └── nginx/        # flujix.conf (reverse proxy)
├── .github/workflows/ci.yml
└── docs/test-plan.md # Plan de pruebas con resultados
```

## 🚀 Instalación y uso (Linux/Ubuntu)

**Requisitos:** Node.js ≥ 18, MongoDB corriendo en `localhost:27017`.

```bash
# 1. Instalar dependencias (backend + frontend)
./devops/scripts/install.sh

# 2. Levantar el backend en desarrollo (puerto 3001)
./devops/scripts/start-dev.sh

# 3. En otra terminal, levantar el frontend
cd frontend && npm run dev      # http://localhost:5173

# 4. Ejecutar las pruebas
./devops/scripts/run-tests.sh
```

> En Windows, los comandos equivalentes son `npm install`, `npm run dev` (backend y frontend) y `npm test` dentro de `backend/`.

### Producción

```bash
./devops/scripts/start-prod.sh   # build del frontend + backend con NODE_ENV=production (puerto 3000)
```

Nginx sirve el build estático y enruta `/api` al backend:

```bash
sudo cp devops/nginx/flujix.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/flujix.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 🔐 Autenticación y roles

La API usa **JWT** (header `Authorization: Bearer <token>`). Hay dos roles:

- **admin** — crea, edita, elimina y asigna tareas; ve el panel de usuarios.
- **user** — ve las tareas del equipo y solo puede cambiar el *status* de las suyas.

Al iniciar la app se ejecuta un **seed** que garantiza el usuario administrador
(`jhostin2quispe@gmail.com`). También puede correrse manualmente:

```bash
cd backend && node src/seeds/adminSeed.js
```

Los registros vía `/api/auth/register` siempre crean usuarios con rol `user`.

## 🔌 API REST

Base: `http://localhost:3001`

| Método | Ruta | Acceso | Descripción | Respuestas |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Público | Registro (rol `user`) | `201`, `400`, `409` |
| `POST` | `/api/auth/login` | Público | Login, devuelve JWT | `200`, `400`, `401` |
| `POST` | `/api/tasks` | Admin | Crear tarea (requiere `assignedTo`) | `201`, `400`, `403` |
| `GET` | `/api/tasks` | Autenticado | Tareas del equipo (`?status=`, `?mine=true`) | `200`, `401` |
| `GET` | `/api/tasks/:id` | Autenticado | Obtener una tarea | `200`, `400`, `404` |
| `PUT` | `/api/tasks/:id` | Admin / dueño | Admin: todo; user: solo `status` de sus tareas | `200`, `400`, `403`, `404` |
| `DELETE` | `/api/tasks/:id` | Admin | Eliminar tarea | `200`, `403`, `404` |
| `GET` | `/api/users` | Admin | Usuarios con conteo de tareas | `200`, `403` |
| `GET` | `/api/health` | Público | Healthcheck | `200` |

**Ejemplo:**

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jhostin2quispe@gmail.com","password":"<password>"}' | jq -r .token)

curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Estudiar para el final","priority":"alta","assignedTo":"<userId>"}'
```

## 🧪 Pruebas

28 casos en [backend/tests/task.test.js](backend/tests/task.test.js): 6 de autenticación, 7 de roles/autorización, 5 funcionales, 6 negativos y 4 de borde. Usan la BD aislada `flujix_test` y se limpian automáticamente.

```bash
cd backend && npm test
```

Resultado de la última ejecución: **28/28 PASS** (detalle en [docs/test-plan.md](docs/test-plan.md)).

## 🔄 CI/CD

En cada push, GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)):

1. Levanta MongoDB 7 como service container.
2. Instala dependencias del backend y ejecuta `npm test`.
3. Reporta el resultado en el summary del workflow.
4. Hace build del frontend y lo publica como artefacto.

## 🌍 Ambientes

| Ambiente | Archivo | Puerto | Base de datos |
|---|---|---|---|
| Desarrollo | `devops/environments/dev.env` | 3001 | `flujix_dev` |
| Pruebas | `devops/environments/test.env` | 3002 | `flujix_test` |
| Producción | `devops/environments/prod.env` | 3000 | `flujix_prod` |
