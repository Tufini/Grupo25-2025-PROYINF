/**
 * Auth Routes
 * Rutas de autenticación
 */

import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post('/register', asyncHandler(authController.register.bind(authController)));

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', asyncHandler(authController.login.bind(authController)));

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/profile', requireAuth, asyncHandler(authController.getProfile.bind(authController)));

/**
 * @route   GET /api/auth/me
 * @desc    Obtener usuario actual (alias de profile para compatibilidad)
 * @access  Private
 */
router.get('/me', requireAuth, asyncHandler(authController.getProfile.bind(authController)));

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambiar contraseña
 * @access  Private
 */
router.put('/change-password', requireAuth, asyncHandler(authController.changePassword.bind(authController)));

/**
 * @route   POST /api/auth/verify-token
 * @desc    Verificar si un token es válido
 * @access  Private
 */
router.post('/verify-token', requireAuth, asyncHandler(authController.verifyToken.bind(authController)));

export default router;
