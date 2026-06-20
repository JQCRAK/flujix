/**
 * Seed del usuario administrador.
 * - Se ejecuta automáticamente al iniciar la app (ver src/app.js).
 * - También puede correrse de forma independiente:
 *     node src/seeds/adminSeed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ADMIN = {
  name: 'Jhostin Quispe',
  email: 'jhostin2quispe@gmail.com',
  password: 'Jhostin2026.!',
  role: 'admin',
};

async function seedAdmin() {
  const exists = await User.findOne({ email: ADMIN.email });
  if (exists) {
    console.log(`[seed] Admin ya existe: ${ADMIN.email}`);
    return exists;
  }

  const hash = await bcrypt.hash(ADMIN.password, 10);
  const admin = await User.create({ ...ADMIN, password: hash });
  console.log(`[seed] Admin creado: ${ADMIN.email} (role: admin)`);
  return admin;
}

// Ejecución independiente: conecta, siembra y desconecta
if (require.main === module) {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flujix';
  mongoose
    .connect(MONGO_URI)
    .then(seedAdmin)
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seed] Error:', err.message);
      process.exit(1);
    });
}

module.exports = { seedAdmin, ADMIN };
