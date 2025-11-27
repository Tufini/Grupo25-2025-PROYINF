/**
 * Types for UsmBank (Aurora Privé) - Zustand Store
 * Comprehensive type definitions for state management
 */

// ==================== ENUMS ====================

export type TipoCliente = 'REGULAR' | 'PREMIUM' | 'VIP';

export type EstadoCredito =
  | 'PENDIENTE'
  | 'EVALUACION'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'DESEMBOLSADO'
  | 'CANCELADO';

export type TipoCredito =
  | 'CONSUMO'
  | 'HIPOTECARIO'
  | 'AUTOMOTRIZ'
  | 'EMPRESARIAL';

export type EstadoCuota =
  | 'PENDIENTE'
  | 'PAGADA'
  | 'MORA'
  | 'VENCIDA';

// ==================== USER & CLIENT ====================

export interface Cliente {
  id: number;
  usuario_id: number;
  rut: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  region: string;
  fecha_nacimiento: string;
  ingresos_mensuales: number;
  score_credito: number;
  tipo: TipoCliente;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  created_at: string;
  updated_at: string;
  cliente?: Cliente;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  usuario?: User;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rut: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  region: string;
  fecha_nacimiento: string;
  ingresos_mensuales: number;
}

export interface LoginData {
  email: string;
  password: string;
}

// ==================== SIMULATION ====================

export interface Simulation {
  monto: number;
  plazo_meses: number;
  tasa_interes: number;
  cuota_mensual: number;
  total_pagar: number;
  total_intereses: number;
}

export interface SimulationRequest {
  monto: number;
  tasa_interes: number;
  plazo_meses: number;
  cliente_id?: number;
}

export interface SimulationResponse {
  success: boolean;
  message: string;
  simulacion: Simulation;
}

// ==================== LOAN REQUEST (CREDITO) ====================

export interface LoanFormData {
  tipo_credito: TipoCredito;
  monto_solicitado: number;
  plazo_meses: number;
  tasa_interes: number;
  motivo: string;
  simulacion_id?: number;
}

export interface LoanRequest {
  currentStep: number;
  maxSteps: number;
  formData: LoanFormData;
  score: number | null;
  isLoading: boolean;
  error: string | null;
}

export interface Credito {
  id: number;
  cliente_id: number;
  simulacion_id?: number;
  tipo_credito: TipoCredito;
  monto_solicitado: number;
  monto_aprobado?: number;
  plazo_meses: number;
  tasa_interes: number;
  cuota_mensual: number;
  total_pagar: number;
  estado: EstadoCredito;
  motivo: string;
  fecha_solicitud: string;
  fecha_aprobacion?: string;
  fecha_desembolso?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface CreditoResponse {
  success: boolean;
  message: string;
  credito?: Credito;
  creditos?: Credito[];
}

// ==================== CUOTAS (AMORTIZATION) ====================

export interface Cuota {
  id: number;
  credito_id: number;
  numero_cuota: number;
  monto_capital: number;
  monto_interes: number;
  monto_total: number;
  saldo_pendiente: number;
  fecha_vencimiento: string;
  fecha_pago?: string;
  estado: EstadoCuota;
  dias_mora?: number;
  monto_mora?: number;
  created_at: string;
  updated_at: string;
}

export interface CuotaResponse {
  success: boolean;
  message: string;
  cuotas?: Cuota[];
}

// ==================== STATISTICS ====================

export interface ClienteEstadisticas {
  total_creditos: number;
  creditos_activos: number;
  creditos_pagados: number;
  deuda_total: number;
  cuotas_en_mora: number;
  tasa_promedio: number;
  historial_pagos: number;
}

// ==================== API ERROR ====================

export interface ApiError {
  success: false;
  message: string;
  error?: string;
  details?: any;
}

export type ApiResponse<T> = T | ApiError;

// ==================== STORE STATE ====================

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SimulationState {
  current: Simulation | null;
  history: Simulation[];
  isLoading: boolean;
  error: string | null;
}

export interface LoanRequestState extends LoanRequest {}

export interface CreditosState {
  creditos: Credito[];
  currentCredito: Credito | null;
  cuotas: Cuota[];
  estadisticas: ClienteEstadisticas | null;
  isLoading: boolean;
  error: string | null;
}
