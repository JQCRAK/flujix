import { createContext, useContext, useState } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

function readStored() {
  try {
    const token = localStorage.getItem('flujix_token');
    const user = JSON.parse(localStorage.getItem('flujix_user') || 'null');
    return token && user ? { token, user } : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStored);

  function persist({ token, user }) {
    localStorage.setItem('flujix_token', token);
    localStorage.setItem('flujix_user', JSON.stringify(user));
    setSession({ token, user });
    return user;
  }

  async function login(email, password) {
    return persist(await api.login(email, password));
  }

  async function register(name, email, password) {
    return persist(await api.register(name, email, password));
  }

  function logout() {
    localStorage.removeItem('flujix_token');
    localStorage.removeItem('flujix_user');
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ user: session?.user || null, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
