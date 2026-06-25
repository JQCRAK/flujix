/**
 * Suite de pruebas de la API Flujix — Jest + Supertest
 * Cubre: AUTENTICACIÓN, ROLES, y pruebas FUNCIONALES, NEGATIVAS y de BORDE.
 * Usa la base de datos flujix_test (se limpia entre pruebas).
 */
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Task = require('../src/models/Task');
const User = require('../src/models/User');
const { signToken } = require('../src/middleware/auth');

const PASSWORD = 'Password123!';
let passwordHash; // hash precalculado para acelerar la creación de usuarios
let mongoServer; // base de datos MongoDB en memoria, solo para pruebas

let admin, user1, user2;
let adminToken, user1Token, user2Token;

beforeAll(async () => {
  // Arranca una base de datos MongoDB en memoria. No requiere instalar Mongo,
  // por lo que funciona igual en local, en Codespaces y en el CI.
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  passwordHash = await bcrypt.hash(PASSWORD, 10);
});

beforeEach(async () => {
  await Task.deleteMany({});
  await User.deleteMany({});

  [admin, user1, user2] = await User.create([
    { name: 'Admin Test', email: 'admin@test.com', password: passwordHash, role: 'admin' },
    { name: 'Usuario Uno', email: 'uno@test.com', password: passwordHash, role: 'user' },
    { name: 'Usuario Dos', email: 'dos@test.com', password: passwordHash, role: 'user' },
  ]);

  adminToken = signToken(admin);
  user1Token = signToken(user1);
  user2Token = signToken(user2);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) await mongoServer.stop();
});

// Helper: crea una tarea directamente en BD (asignada a user1 por defecto)
async function seedTask(overrides = {}) {
  return Task.create({
    title: 'Tarea de prueba',
    description: 'Descripción de prueba',
    status: 'pendiente',
    priority: 'media',
    assignedTo: user1._id,
    assignedBy: admin._id,
    ...overrides,
  });
}

const asAdmin = () => `Bearer ${adminToken}`;
const asUser1 = () => `Bearer ${user1Token}`;
const asUser2 = () => `Bearer ${user2Token}`;

/* ============================================================
 * PRUEBAS DE AUTENTICACIÓN
 * ============================================================ */
describe('Pruebas de AUTENTICACIÓN', () => {
  test('TC-A01: Registro válido → 201 con token y role "user"', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Nuevo Usuario',
      email: 'nuevo@test.com',
      password: 'Secreta123',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({
      name: 'Nuevo Usuario',
      email: 'nuevo@test.com',
      role: 'user',
    });
    expect(res.body.user).not.toHaveProperty('password');
  });

  test('TC-A02: Registro con email duplicado → 409', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Repetido',
      email: 'uno@test.com',
      password: 'Secreta123',
    });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  test('TC-A03: Login con credenciales válidas → 200 con token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: PASSWORD,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('admin');
  });

  test('TC-A04: Login con contraseña incorrecta → 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'incorrecta',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('TC-A05: Acceso a /api/tasks sin token → 401', async () => {
    const res = await request(app).get('/api/tasks');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('TC-A06: Acceso con token inválido → 401', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer token-falso');

    expect(res.statusCode).toBe(401);
  });
});

/* ============================================================
 * PRUEBAS DE ROLES Y PERMISOS
 * ============================================================ */
describe('Pruebas de ROLES', () => {
  test('TC-R01: Usuario normal intenta crear tarea → 403', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', asUser1())
      .send({ title: 'No debería poder', assignedTo: user1._id.toString() });

    expect(res.statusCode).toBe(403);
  });

  test('TC-R02: Usuario normal intenta eliminar tarea → 403', async () => {
    const task = await seedTask();

    const res = await request(app)
      .delete(`/api/tasks/${task._id}`)
      .set('Authorization', asUser1());

    expect(res.statusCode).toBe(403);
  });

  test('TC-R03: Usuario intenta cambiar status de tarea ajena → 403', async () => {
    const task = await seedTask({ assignedTo: user2._id });

    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', asUser1())
      .send({ status: 'completado' });

    expect(res.statusCode).toBe(403);
  });

  test('TC-R04: Usuario intenta editar el título de su propia tarea → 403', async () => {
    const task = await seedTask({ assignedTo: user1._id });

    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', asUser1())
      .send({ title: 'Título hackeado' });

    expect(res.statusCode).toBe(403);

    const inDb = await Task.findById(task._id);
    expect(inDb.title).toBe('Tarea de prueba');
  });

  test('TC-R05: GET /api/users como usuario normal → 403', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', asUser1());

    expect(res.statusCode).toBe(403);
  });

  test('TC-R06: GET /api/users como admin → 200 con conteo de tareas', async () => {
    await seedTask({ assignedTo: user1._id });
    await seedTask({ assignedTo: user1._id });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', asAdmin());

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(3);

    const uno = res.body.find((u) => u.email === 'uno@test.com');
    expect(uno.taskCount).toBe(2);
    expect(uno).toHaveProperty('name');
    expect(uno).toHaveProperty('createdAt');
    expect(uno).not.toHaveProperty('password');
  });

  test('TC-R07: Usuario ve tareas del equipo y ?mine=true filtra las suyas', async () => {
    await seedTask({ assignedTo: user1._id, title: 'Mía' });
    await seedTask({ assignedTo: user2._id, title: 'Ajena' });

    const all = await request(app)
      .get('/api/tasks')
      .set('Authorization', asUser1());
    expect(all.statusCode).toBe(200);
    expect(all.body).toHaveLength(2);

    const mine = await request(app)
      .get('/api/tasks?mine=true')
      .set('Authorization', asUser1());
    expect(mine.statusCode).toBe(200);
    expect(mine.body).toHaveLength(1);
    expect(mine.body[0].title).toBe('Mía');
  });
});

/* ============================================================
 * PRUEBAS FUNCIONALES
 * ============================================================ */
describe('Pruebas FUNCIONALES', () => {
  test('TC-F01: Admin crea tarea válida con assignedTo → 201', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', asAdmin())
      .send({
        title: 'Comprar materiales',
        description: 'Para el proyecto final',
        status: 'pendiente',
        priority: 'alta',
        assignedTo: user1._id.toString(),
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Comprar materiales');
    expect(res.body.assignedTo._id).toBe(user1._id.toString());
    expect(res.body.assignedBy._id).toBe(admin._id.toString());
    expect(res.body).toHaveProperty('createdAt');
  });

  test('TC-F02: Listar tareas → 200 con array y datos del asignado', async () => {
    await seedTask({ title: 'Tarea 1' });
    await seedTask({ title: 'Tarea 2' });

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', asAdmin());

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].assignedTo).toHaveProperty('name');
  });

  test('TC-F03: Obtener tarea por ID → 200 con la tarea correcta', async () => {
    const task = await seedTask({ title: 'Buscarme por ID' });

    const res = await request(app)
      .get(`/api/tasks/${task._id}`)
      .set('Authorization', asUser1());

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(task._id.toString());
    expect(res.body.title).toBe('Buscarme por ID');
  });

  test('TC-F04: Usuario cambia status de SU tarea → 200', async () => {
    const task = await seedTask({ assignedTo: user1._id, status: 'pendiente' });

    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', asUser1())
      .send({ status: 'en_progreso' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('en_progreso');

    const inDb = await Task.findById(task._id);
    expect(inDb.status).toBe('en_progreso');
  });

  test('TC-F05: Admin elimina tarea → 200 y ya no existe en BD', async () => {
    const task = await seedTask();

    const res = await request(app)
      .delete(`/api/tasks/${task._id}`)
      .set('Authorization', asAdmin());

    expect(res.statusCode).toBe(200);
    const inDb = await Task.findById(task._id);
    expect(inDb).toBeNull();
  });
});

/* ============================================================
 * PRUEBAS NEGATIVAS
 * ============================================================ */
describe('Pruebas NEGATIVAS', () => {
  test('TC-N01: Crear tarea sin título → 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', asAdmin())
      .send({ description: 'Sin título', assignedTo: user1._id.toString() });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('TC-N02: Crear tarea sin assignedTo → 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', asAdmin())
      .send({ title: 'Sin asignar' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('TC-N03: Obtener tarea con ID inválido → 400', async () => {
    const res = await request(app)
      .get('/api/tasks/esto-no-es-un-id')
      .set('Authorization', asAdmin());

    expect(res.statusCode).toBe(400);
  });

  test('TC-N04: Obtener tarea con ID válido pero inexistente → 404', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/tasks/${fakeId}`)
      .set('Authorization', asAdmin());

    expect(res.statusCode).toBe(404);
  });

  test('TC-N05: Editar tarea con status inválido → 400', async () => {
    const task = await seedTask();

    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', asAdmin())
      .send({ status: 'terminadisima' });

    expect(res.statusCode).toBe(400);

    const inDb = await Task.findById(task._id);
    expect(inDb.status).toBe('pendiente');
  });

  test('TC-N06: Eliminar tarea inexistente → 404', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/tasks/${fakeId}`)
      .set('Authorization', asAdmin());

    expect(res.statusCode).toBe(404);
  });
});

/* ============================================================
 * PRUEBAS DE BORDE
 * ============================================================ */
describe('Pruebas de BORDE', () => {
  test('TC-B01: Título con exactamente 100 caracteres → 201 (acepta)', async () => {
    const title100 = 'a'.repeat(100);

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', asAdmin())
      .send({ title: title100, assignedTo: user1._id.toString() });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toHaveLength(100);
  });

  test('TC-B02: Título con 101 caracteres → 400 (rechaza)', async () => {
    const title101 = 'a'.repeat(101);

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', asAdmin())
      .send({ title: title101, assignedTo: user1._id.toString() });

    expect(res.statusCode).toBe(400);
  });

  test('TC-B03: Crear tarea con campos extra no permitidos → los ignora', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', asAdmin())
      .send({
        title: 'Tarea con extras',
        assignedTo: user1._id.toString(),
        hacker: 'inyección',
        admin: true,
        _id: '000000000000000000000000',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).not.toHaveProperty('hacker');
    expect(res.body).not.toHaveProperty('admin');
    expect(res.body._id).not.toBe('000000000000000000000000');
  });

  test('TC-B04: Listar cuando no hay tareas → 200 con array vacío []', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', asAdmin());

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
});
