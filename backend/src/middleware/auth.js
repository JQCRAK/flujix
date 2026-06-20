const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'flujix-dev-secret';

// Verifica el JWT del header "Authorization: Bearer <token>"
// y agrega req.user = { id, name, email, role }.
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Requiere que auth haya corrido antes. Solo deja pasar admins.
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Requiere permisos de administrador' });
  }
  return next();
}

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { auth, adminOnly, signToken, JWT_SECRET };
