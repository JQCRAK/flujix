# Plan de Pruebas — Flujix

**Proyecto:** Flujix — Sistema web de gestión de tareas con autenticación y roles
**Materia:** Proyecto Integrador DevOps + Verificación y Validación
**Fecha de ejecución:** 2026-06-11
**Herramientas:** Jest 29 + Supertest 7, MongoDB 27017 (base `flujix_test`)

---

## 1. Alcance del sistema

Flujix es un sistema web de gestión de tareas en equipo compuesto por:

- **Backend:** API REST en Node.js + Express (puerto 3001) con persistencia en MongoDB. Expone autenticación JWT (`/api/auth`), CRUD de tareas con control de roles (`/api/tasks`) y administración de usuarios (`/api/users`).
- **Frontend:** SPA en React (Vite) con login/registro, rutas protegidas y vistas diferenciadas por rol (admin / user).

**Dentro del alcance de este plan:** la API REST del backend (autenticación, autorización por roles, validaciones del modelo, códigos HTTP, persistencia).
**Fuera del alcance:** pruebas de UI automatizadas del frontend, pruebas de carga/rendimiento y pruebas de penetración.

### Modelos bajo prueba

**User:**

| Campo | Tipo | Restricciones |
|---|---|---|
| `name` | String | Requerido |
| `email` | String | Requerido, único, formato válido |
| `password` | String | Requerido, mínimo 6 caracteres, hash bcrypt (nunca se expone en JSON) |
| `role` | Enum | `admin` \| `user` (default `user`) |

**Task:**

| Campo | Tipo | Restricciones |
|---|---|---|
| `title` | String | Requerido, máximo 100 caracteres |
| `description` | String | Opcional |
| `status` | Enum | `pendiente` \| `en_progreso` \| `completado` (default `pendiente`) |
| `priority` | Enum | `baja` \| `media` \| `alta` (default `media`) |
| `assignedTo` | ObjectId → User | Requerido (a quién se asigna) |
| `assignedBy` | ObjectId → User | Quién la creó (se fija automáticamente al admin creador) |

### Reglas de autorización verificadas

| Acción | Admin | User |
|---|---|---|
| Crear tarea | ✔ (debe incluir `assignedTo`) | ✘ 403 |
| Listar tareas | Todas | Todas las del equipo (`?mine=true` filtra las propias) |
| Editar tarea | Todos los campos | Solo `status`, solo en tareas propias; otro campo o tarea ajena → 403 |
| Eliminar tarea | ✔ | ✘ 403 |
| Listar usuarios | ✔ | ✘ 403 |
| Cualquier endpoint sin token | — | 401 |

## 2. Tipos de pruebas

| Tipo | Objetivo | Casos |
|---|---|---|
| **Autenticación** | Verificar registro, login, rechazo de credenciales inválidas y protección por token. | TC-A01 a TC-A06 |
| **Roles/Autorización** | Verificar que cada rol solo puede ejecutar las acciones permitidas (403 en caso contrario). | TC-R01 a TC-R07 |
| **Funcionales** | Verificar el CRUD completo en el camino feliz con el rol correcto. | TC-F01 a TC-F05 |
| **Negativas** | Verificar que entradas inválidas reciben `400`/`404` sin corromper datos. | TC-N01 a TC-N06 |
| **De borde** | Verificar límites exactos de las reglas de negocio (100/101 chars, lista vacía, mass assignment). | TC-B01 a TC-B04 |

Las pruebas usan la base aislada `flujix_test`, que se limpia antes de cada caso (`beforeEach` recrea admin y 2 usuarios) y se elimina al final (`afterAll`).

## 3. Tabla de casos de prueba

Resultados de la ejecución real del 2026-06-11 (`npm test`):

| ID | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| TC-A01 | Registro válido | `POST /api/auth/register` con name, email, password | `201` + token + user con role `user`, sin password | `201` + token, role `user` | ✅ PASS |
| TC-A02 | Registro email duplicado | Registro con email ya existente | `409` | `409` + `{error}` | ✅ PASS |
| TC-A03 | Login válido | `POST /api/auth/login` credenciales correctas | `200` + token | `200` + token | ✅ PASS |
| TC-A04 | Login contraseña incorrecta | Login con password errónea | `401` | `401` + `{error}` | ✅ PASS |
| TC-A05 | Acceso sin token | `GET /api/tasks` sin header Authorization | `401` | `401` | ✅ PASS |
| TC-A06 | Token inválido | `GET /api/tasks` con token falso | `401` | `401` | ✅ PASS |
| TC-R01 | User crea tarea | `POST /api/tasks` con token de user | `403` | `403` | ✅ PASS |
| TC-R02 | User elimina tarea | `DELETE /api/tasks/:id` con token de user | `403` | `403` | ✅ PASS |
| TC-R03 | User cambia status de tarea ajena | `PUT` status en tarea de otro usuario | `403` | `403` | ✅ PASS |
| TC-R04 | User edita título de su tarea | `PUT` con `{title}` en tarea propia | `403` y título intacto en BD | `403`; BD sin cambios | ✅ PASS |
| TC-R05 | User lista usuarios | `GET /api/users` con token de user | `403` | `403` | ✅ PASS |
| TC-R06 | Admin lista usuarios | `GET /api/users` con token admin | `200` + taskCount correcto, sin passwords | `200`; taskCount=2 verificado | ✅ PASS |
| TC-R07 | Visibilidad de equipo + filtro propio | `GET /api/tasks` y `GET /api/tasks?mine=true` como user | Todas (2) / solo las propias (1) | 2 y 1 respectivamente | ✅ PASS |
| TC-F01 | Admin crea tarea válida | `POST` con title, assignedTo válidos | `201` + assignedBy = admin | `201`; populate correcto | ✅ PASS |
| TC-F02 | Listar tareas | `GET /api/tasks` (2 precargadas) | `200` + array con datos del asignado | `200` + 2 con `assignedTo.name` | ✅ PASS |
| TC-F03 | Obtener por ID | `GET /api/tasks/:id` existente | `200` + tarea correcta | `200` | ✅ PASS |
| TC-F04 | User cambia status de SU tarea | `PUT {status: "en_progreso"}` en tarea propia | `200` + persistido en BD | `200`; verificado en BD | ✅ PASS |
| TC-F05 | Admin elimina tarea | `DELETE /api/tasks/:id` | `200` + ya no existe en BD | `200`; eliminada | ✅ PASS |
| TC-N01 | Crear sin título | `POST` sin `title` (admin) | `400` | `400` | ✅ PASS |
| TC-N02 | Crear sin assignedTo | `POST` sin `assignedTo` (admin) | `400` | `400` | ✅ PASS |
| TC-N03 | ID inválido | `GET /api/tasks/esto-no-es-un-id` | `400` | `400` | ✅ PASS |
| TC-N04 | ID válido inexistente | `GET` con ObjectId nuevo | `404` | `404` | ✅ PASS |
| TC-N05 | Status inválido | `PUT {status: "terminadisima"}` (admin) | `400` y BD intacta | `400`; BD conserva `pendiente` | ✅ PASS |
| TC-N06 | Eliminar inexistente | `DELETE` con ObjectId nuevo (admin) | `404` | `404` | ✅ PASS |
| TC-B01 | Título de 100 caracteres | `POST` title con exactamente 100 chars | `201` (acepta) | `201` | ✅ PASS |
| TC-B02 | Título de 101 caracteres | `POST` title con 101 chars | `400` (rechaza) | `400` | ✅ PASS |
| TC-B03 | Campos extra (mass assignment) | `POST` con `hacker`, `admin`, `_id` forzado | `201` ignorándolos | `201`; extras ausentes | ✅ PASS |
| TC-B04 | Listar sin tareas | `GET /api/tasks` colección vacía | `200` + `[]` | `200` + `[]` | ✅ PASS |

**Resumen de ejecución real:**

```
Test Suites: 1 passed, 1 total
Tests:       28 passed, 28 total
Snapshots:   0 total
Time:        4.562 s
```

Verificación adicional de extremo a extremo (manual, 2026-06-11):

- Seed standalone: `node src/seeds/adminSeed.js` → `[seed] Admin creado: jhostin2quispe@gmail.com (role: admin)`.
- Arranque de la app: el seed se ejecuta automáticamente (`[seed] Admin ya existe`).
- `POST /api/auth/login` con las credenciales del admin → `200` con JWT y `role: "admin"`.
- Flujo en navegador: `/login` → autenticación → redirección a `/admin` → panel de Usuarios visible. Sin errores de consola.

## 4. Criterios de aceptación

1. **100 % de los casos de autenticación pasan** — registro/login correctos y todo endpoint protegido rechaza peticiones sin token válido. ✅ (6/6)
2. **100 % de los casos de autorización pasan** — ningún usuario puede ejecutar acciones de admin ni modificar tareas ajenas. ✅ (7/7)
3. **100 % funcionales, negativas y de borde.** ✅ (5/5, 6/6, 4/4)
4. Las contraseñas se almacenan con hash bcrypt y **nunca** viajan en las respuestas. ✅ (verificado en TC-A01 y TC-R06)
5. Suite reproducible y aislada en `flujix_test`, ejecutada en CI en cada push. ✅

**Veredicto: ACEPTADO — 28/28 pruebas en verde.**

## 5. Análisis de errores encontrados

| # | Hallazgo | Riesgo | Solución aplicada |
|---|---|---|---|
| 1 | Mongoose lanza `CastError` ante IDs malformados → `500` genérico. | Respuestas incorrectas ante entradas inválidas. | Validación con `ObjectId.isValid()` antes de consultar; responde `400`. |
| 2 | `findByIdAndUpdate` no ejecuta validadores por defecto. | Datos corruptos (status inválido guardado). | `runValidators: true` en todas las actualizaciones. |
| 3 | Aceptar el body completo permite *mass assignment*. | Inyección de `_id`, role o campos arbitrarios. | Whitelist de campos por rol: admin (5 campos), user (solo `status`). |
| 4 | El hash de contraseña podía filtrarse en respuestas JSON. | Exposición de credenciales hasheadas. | Transform `toJSON` en el modelo User elimina `password`; verificado por pruebas. |
| 5 | Un user podía editar campos arbitrarios de sus tareas enviando `title`/`priority` junto al `status`. | Escalación de privilegios parcial. | El controlador responde `403` si un user envía cualquier campo distinto de `status` (TC-R04). |
| 6 | Conflicto de especificación: el backend debía filtrar tareas por usuario, pero la vista de usuario requiere ver todas las del equipo. | Inconsistencia API/UI. | `GET /api/tasks` devuelve las tareas del equipo a todo usuario autenticado y `?mine=true` filtra las propias (TC-R07); la edición sigue restringida por dueño. |
| 7 | Ejecutar pruebas contra la BD real borraría datos (`deleteMany`). | Pérdida de datos. | BD dedicada `flujix_test` vía `MONGO_URI_TEST` / `test.env`. |

No quedaron defectos abiertos al cierre de la ejecución.
