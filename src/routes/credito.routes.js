/**
 * Credito Routes
 * Rutas de créditos y simulaciones
 */

import { Router } from 'express';
import creditoController from '../controllers/credito.controller.js';
import { requireAuth, requireCliente, optionalAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

// ============================================================================
// SIMULACIONES
// ============================================================================

/**
 * @route   POST /api/simulaciones
 * @desc    Simular crédito (público o autenticado)
 * @access  Public (guarda cliente_id si está autenticado)
 */
router.post('/simulaciones', optionalAuth, asyncHandler(creditoController.simular.bind(creditoController)));

/**
 * @route   GET /api/simulaciones
 * @desc    Obtener historial de simulaciones del cliente
 * @access  Private (requiere autenticación)
 */
router.get('/simulaciones', requireAuth, requireCliente, asyncHandler(creditoController.obtenerHistorialSimulaciones.bind(creditoController)));

// ============================================================================
// CRÉDITOS
// ============================================================================

/**
 * @route   POST /api/creditos
 * @desc    Solicitar crédito (con autenticación opcional para demo)
 * @access  Public (guarda cliente_id si está autenticado)
 */
router.post('/creditos', optionalAuth, asyncHandler(creditoController.solicitar.bind(creditoController)));

/**
 * @route   GET /api/creditos
 * @desc    Obtener todos los créditos del cliente
 * @access  Private
 */
router.get('/creditos', requireAuth, requireCliente, asyncHandler(creditoController.obtenerCreditos.bind(creditoController)));

/**
 * @route   GET /api/creditos/estadisticas
 * @desc    Obtener estadísticas de créditos del cliente
 * @access  Private
 */
router.get('/creditos/estadisticas', requireAuth, requireCliente, asyncHandler(creditoController.obtenerEstadisticas.bind(creditoController)));

/**
 * @route   GET /api/creditos/:id
 * @desc    Obtener detalle de un crédito específico
 * @access  Private
 */
router.get('/creditos/:id', requireAuth, requireCliente, asyncHandler(creditoController.obtenerDetalle.bind(creditoController)));

// ============================================================================
// ADMINISTRACIÓN DE CRÉDITOS (futuro - requeriría rol de admin)
// ============================================================================

/**
 * @route   POST /api/creditos/:id/aprobar
 * @desc    Aprobar crédito
 * @access  Private (Admin) - actualmente abierto para demo
 */
router.post('/creditos/:id/aprobar', asyncHandler(creditoController.aprobar.bind(creditoController)));

/**
 * @route   POST /api/creditos/:id/desembolsar
 * @desc    Desembolsar crédito
 * @access  Private (Admin) - actualmente abierto para demo
 */
router.post('/creditos/:id/desembolsar', asyncHandler(creditoController.desembolsar.bind(creditoController)));

/**
 * @route   POST /api/creditos/:id/rechazar
 * @desc    Rechazar crédito
 * @access  Private (Admin) - actualmente abierto para demo
 */
router.post('/creditos/:id/rechazar', asyncHandler(creditoController.rechazar.bind(creditoController)));

export default router;
