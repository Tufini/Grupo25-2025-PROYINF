/**
 * Auth Controller
 * Controlador para endpoints de autenticación
 */

import authService from '../services/auth.service.js';

export class AuthController {
    /**
     * POST /api/auth/register
     * Registrar nuevo usuario
     */
    async register(req, res) {
        const { email, password, nombre, apellido, rut, telefono } = req.body;

        const result = await authService.register({
            email,
            password,
            nombre,
            apellido,
            rut,
            telefono,
        });

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            data: result
        });
    }

    /**
     * POST /api/auth/login
     * Iniciar sesión
     */
    async login(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'Email y contraseña son requeridos'
            });
        }

        const result = await authService.login(email, password);

        res.status(200).json({
            message: 'Login exitoso',
            data: result
        });
    }

    /**
     * GET /api/auth/profile
     * Obtener perfil del usuario autenticado
     */
    async getProfile(req, res) {
        const usuarioId = req.user.id;

        const perfil = await authService.getProfile(usuarioId);

        res.status(200).json({
            data: perfil
        });
    }

    /**
     * PUT /api/auth/change-password
     * Cambiar contraseña
     */
    async changePassword(req, res) {
        const usuarioId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'Contraseña actual y nueva contraseña son requeridas'
            });
        }

        const result = await authService.changePassword(usuarioId, oldPassword, newPassword);

        res.status(200).json(result);
    }

    /**
     * POST /api/auth/verify-token
     * Verificar si un token es válido
     */
    async verifyToken(req, res) {
        // Si llegó hasta aquí, el token es válido (pasó por requireAuth middleware)
        res.status(200).json({
            valid: true,
            user: req.user
        });
    }
}

export default new AuthController();
