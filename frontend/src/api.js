// Cliente de la API Flujix.
// En desarrollo, el proxy de Vite redirige /api → http://localhost:3001.
// Puede sobreescribirse con VITE_API_URL (ej. en producción detrás de Nginx).
const BASE = import.meta.env.VITE_API_URL || '';

function authHeaders() {
  const token = localStorage.getItem('flujix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  if (res.status === 401 && !res.url.includes('/api/auth/')) {
    // Sesión expirada o token inválido: limpiar y volver al login
    localStorage.removeItem('flujix_token');
    localStorage.removeItem('flujix_user');
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // --- Auth ---
  login: (email, password) =>
    fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(handle),

  register: (name, email, password) =>
    fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    }).then(handle),

  // --- Tasks ---
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE}/api/tasks${qs ? `?${qs}` : ''}`, {
      headers: authHeaders(),
    }).then(handle);
  },

  create: (task) =>
    fetch(`${BASE}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(task),
    }).then(handle),

  update: (id, changes) =>
    fetch(`${BASE}/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(changes),
    }).then(handle),

  remove: (id) =>
    fetch(`${BASE}/api/tasks/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(handle),

  // --- Users (solo admin) ---
  users: () =>
    fetch(`${BASE}/api/users`, { headers: authHeaders() }).then(handle),
};
