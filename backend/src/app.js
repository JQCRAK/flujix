require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const tasksRouter = require('./routes/tasks');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const { seedAdmin } = require('./seeds/adminSeed');

const app = express();

app.use(cors());
app.use(express.json());

// Healthcheck (útil para Nginx y monitoreo)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', env: process.env.NODE_ENV || 'development' });
});

app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/users', usersRouter);

// 404 para rutas no definidas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Arranque solo cuando se ejecuta directamente (node src/app.js).
// Al importarlo desde los tests, supertest usa la app sin abrir puerto.
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flujix';

  mongoose
    .connect(MONGO_URI)
    .then(async () => {
      console.log(`[flujix] Conectado a MongoDB: ${MONGO_URI}`);
      await seedAdmin(); // garantiza que el admin exista al iniciar
      app.listen(PORT, () => {
        console.log(`[flujix] API escuchando en http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('[flujix] Error conectando a MongoDB:', err.message);
      process.exit(1);
    });
}

module.exports = app;
