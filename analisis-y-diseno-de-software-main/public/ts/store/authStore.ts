/**
 * Auth Store - Manejo de autenticación con Zustand
 * Integrado con backend JWT
 */

import { create } from 'zustand';

// ============================================================================
// TIPOS
// ============================================================================

export interface Cliente {
  id: number;
  rut: string;
  telefono: string | null;
  direccion?: string | null;
  ingresosMensuales: number;
  scoreCredito: number;
  tipo: 'REGULAR' | 'PREMIUM' | 'VIP';
}

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  fechaRegistro?: string;
  ultimoAcceso?: string;
  cliente?: Cliente;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Acciones
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rut: string;
  telefono?: string;
}

// ============================================================================
// STORE
// ============================================================================

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  /**
   * Login de usuario
   */
  login: async (email: string, password: string) => {
    set({ isLoading: true });

    try {

      const API_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || 'http://localhost:3000';

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al iniciar sesión');
      }

      const { usuario, token } = result.data;

      // 1. Guardar token
      localStorage.setItem('token', token);

      // 2. Actualizar estado en memoria
      set({
        user: usuario,
        token: token,
        isAuthenticated: true,
        isLoading: false,
      });

      // ¡OJO! Aquí NO redirigimos. Dejamos que el componente lo haga.
      console.log('✅ Login exitoso en el Store');

    } catch (error) {
      console.error('Error en login:', error);
      set({ isLoading: false });
      throw error; // Lanzamos el error para que el componente muestre una alerta si quiere
    }
  },

  /**
   * Registro de usuario
   */
  register: async (data: RegisterData) => {
    set({ isLoading: true });

    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al registrarse');
      }

      // El backend devuelve { data: { usuario, cliente, token } }
      const { usuario, token } = result.data;

      // Auto-login después del registro
      localStorage.setItem('token', token);

      set({
        user: usuario,
        token: token,
        isAuthenticated: true,
        isLoading: false,
      });

    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Logout
   */
  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  /**
   * Verificar autenticación (al cargar la app)
   */
  checkAuth: async () => {
    set({ isLoading: true });

    const token = localStorage.getItem('token');

    if (!token) {
      set({ isAuthenticated: false, user: null, token: null, isLoading: false });
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error('Token inválido');
      }

      // El backend devuelve { data: { id, email, nombre, ... } }
      set({
        user: result.data,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

    } catch (error) {
      // Token inválido, limpiar
      localStorage.removeItem('token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updateUser: (user: User) => {
    set({ user });
  },
}));
