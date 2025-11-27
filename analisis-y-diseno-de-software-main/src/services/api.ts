/**
 * API Service for UsmBank (Aurora Privé)
 * Handles all HTTP requests to the backend with JWT authentication
 */

import type {
  ApiResponse,
  AuthResponse,
  LoginData,
  RegisterData,
  SimulationRequest,
  SimulationResponse,
  LoanFormData,
  CreditoResponse,
  CuotaResponse,
  ClienteEstadisticas,
  User,
} from '../types';

// ==================== CONFIG ====================

const API_BASE_URL =
  (typeof window !== 'undefined' && (window as any).VITE_API_URL) ||
  'http://localhost:3000/api';

// Token storage key
const TOKEN_KEY = 'aurora_prive_token';

// ==================== TOKEN MANAGEMENT ====================

export const tokenManager = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  set: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  },

  remove: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  },
};

// ==================== HTTP CLIENT ====================

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { requiresAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Add JWT token if authentication is required
  if (requiresAuth) {
    const token = tokenManager.get();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    // Parse JSON response
    const data = await response.json();

    // Handle HTTP errors
    if (!response.ok) {
      return {
        success: false,
        message: data.message || `HTTP error ${response.status}`,
        error: data.error,
      };
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error',
      error: 'NETWORK_ERROR',
    };
  }
}

// ==================== AUTH ENDPOINTS ====================

export const authAPI = {
  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    return fetchAPI<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Login user and get JWT token
   */
  login: async (data: LoginData): Promise<ApiResponse<AuthResponse>> => {
    return fetchAPI<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get current user profile (requires authentication)
   */
  getProfile: async (): Promise<ApiResponse<{ success: boolean; usuario: User }>> => {
    return fetchAPI('/auth/profile', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  /**
   * Change user password (requires authentication)
   */
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return fetchAPI('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },

  /**
   * Verify JWT token validity
   */
  verifyToken: async (): Promise<ApiResponse<{ success: boolean; valid: boolean }>> => {
    return fetchAPI('/auth/verify-token', {
      method: 'POST',
      requiresAuth: true,
    });
  },
};

// ==================== SIMULATION ENDPOINTS ====================

export const simulationAPI = {
  /**
   * Simulate a loan (public - no auth required)
   */
  simulate: async (data: SimulationRequest): Promise<ApiResponse<SimulationResponse>> => {
    return fetchAPI<SimulationResponse>('/simulaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get simulation history (requires authentication)
   */
  getHistory: async (): Promise<
    ApiResponse<{ success: boolean; simulaciones: any[] }>
  > => {
    return fetchAPI('/simulaciones', {
      method: 'GET',
      requiresAuth: true,
    });
  },
};

// ==================== CREDITO ENDPOINTS ====================

export const creditoAPI = {
  /**
   * Create a new loan request (requires authentication)
   */
  create: async (data: LoanFormData): Promise<ApiResponse<CreditoResponse>> => {
    return fetchAPI<CreditoResponse>('/creditos', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },

  /**
   * Get all loans for the current user (requires authentication)
   */
  getAll: async (): Promise<ApiResponse<CreditoResponse>> => {
    return fetchAPI<CreditoResponse>('/creditos', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  /**
   * Get a specific loan by ID (requires authentication)
   */
  getById: async (
    id: number
  ): Promise<
    ApiResponse<{
      success: boolean;
      credito: any;
      tabla_amortizacion: any[];
    }>
  > => {
    return fetchAPI(`/creditos/${id}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  /**
   * Get client statistics (requires authentication)
   */
  getStatistics: async (): Promise<
    ApiResponse<{
      success: boolean;
      estadisticas: ClienteEstadisticas;
    }>
  > => {
    return fetchAPI('/creditos/estadisticas', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  /**
   * Approve a loan (admin only - requires authentication)
   */
  approve: async (
    id: number,
    montoAprobado: number
  ): Promise<ApiResponse<CreditoResponse>> => {
    return fetchAPI<CreditoResponse>(`/creditos/${id}/aprobar`, {
      method: 'POST',
      body: JSON.stringify({ monto_aprobado: montoAprobado }),
      requiresAuth: true,
    });
  },

  /**
   * Disburse a loan (admin only - requires authentication)
   */
  disburse: async (id: number): Promise<ApiResponse<CreditoResponse>> => {
    return fetchAPI<CreditoResponse>(`/creditos/${id}/desembolsar`, {
      method: 'POST',
      requiresAuth: true,
    });
  },

  /**
   * Reject a loan (admin only - requires authentication)
   */
  reject: async (
    id: number,
    observaciones: string
  ): Promise<ApiResponse<CreditoResponse>> => {
    return fetchAPI<CreditoResponse>(`/creditos/${id}/rechazar`, {
      method: 'POST',
      body: JSON.stringify({ observaciones }),
      requiresAuth: true,
    });
  },
};

// ==================== HEALTH CHECK ====================

export const healthAPI = {
  /**
   * Check API health status
   */
  check: async (): Promise<
    ApiResponse<{
      success: boolean;
      message: string;
      timestamp: string;
    }>
  > => {
    return fetchAPI('/health', {
      method: 'GET',
    });
  },
};

// ==================== EXPORT ALL ====================

export const api = {
  auth: authAPI,
  simulation: simulationAPI,
  credito: creditoAPI,
  health: healthAPI,
  token: tokenManager,
};

export default api;
