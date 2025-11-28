/**
 * Authentication Middleware
 * Middleware para verificar autenticación JWT
 */

import authService from '../services/auth.service.js';
import usuarioRepository from '../repositories/usuario.repository.js';
import clienteRepository from '../repositories/cliente.repository.js';

/**
 * Verificar que el request tiene un token JWT válido
 */
export async function requireAuth(req, res, next) {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                error: 'Token no proporcionado',
                message: 'Debe incluir el header Authorization con formato "Bearer <token>"'
            });
        }

        // Verificar formato "Bearer <token>"
        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                error: 'Formato de token inválido',
                message: 'El header Authorization debe tener formato "Bearer <token>"'
            });
        }

        const token = parts[1];

        // Verificar token
        const decoded = authService.verifyToken(token);

        // Obtener usuario actualizado de la base de datos
        const usuario = await usuarioRepository.findById(decoded.id);

        if (!usuario) {
            return res.status(401).json({
                error: 'Usuario no encontrado',
                message: 'El usuario asociado al token no existe'
            });
        }

        if (!usuario.activo) {
            return res.status(403).json({
                error: 'Cuenta desactivada',
                message: 'Su cuenta ha sido desactivada. Contacte a soporte'
            });
        }

        // Obtener cliente asociado
        const cliente = await clienteRepository.findByUsuarioId(usuario.id);

        // Agregar usuario al request
        req.user = {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            clienteId: cliente?.id || null,
            tipoCliente: cliente?.tipo || null
        };

        next();
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({
                error: error.message
            });
        }

        console.error('Error en middleware de autenticación:', error);
        return res.status(500).json({
            error: 'Error al verificar autenticación'
        });
    }
}

/**
 * Verificar que el usuario es cliente (tiene perfil de cliente)
 */
export function requireCliente(req, res, next) {
    if (!req.user || !req.user.clienteId) {
        return res.status(403).json({
            error: 'Acceso denegado',
            message: 'Debe tener un perfil de cliente para acceder a este recurso'
        });
    }

    next();
}

/**
 * Verificar que el usuario es cliente Premium o VIP
 */
export function requirePremium(req, res, next) {
    if (!req.user || !req.user.tipoCliente) {
        return res.status(403).json({
            error: 'Acceso denegado',
            message: 'Debe ser cliente Premium o VIP para acceder a este recurso'
        });
    }

    const tiposPermitidos = ['PREMIUM', 'VIP'];

    if (!tiposPermitidos.includes(req.user.tipoCliente)) {
        return res.status(403).json({
            error: 'Acceso denegado',
            message: 'Este recurso está disponible solo para clientes Premium y VIP'
        });
    }

    next();
}

/**
 * Middleware opcional de autenticación
 * Agrega usuario al request si hay token válido, pero no requiere autenticación
 */
export async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next();
        }

        const parts = authHeader.split(' ');

        if (parts.length === 2 && parts[0] === 'Bearer') {
            const token = parts[1];
            const decoded = authService.verifyToken(token);
            const usuario = await usuarioRepository.findById(decoded.id);

            if (usuario && usuario.activo) {
                const cliente = await clienteRepository.findByUsuarioId(usuario.id);

                req.user = {
                    id: usuario.id,
                    email: usuario.email,
                    nombre: usuario.nombre,
                    apellido: usuario.apellido,
                    clienteId: cliente?.id || null,
                    tipoCliente: cliente?.tipo || null
                };
            }
        }
    } catch (error) {
        // Ignorar errores en auth opcional
        console.log('Token inválido en auth opcional:', error.message);
    }

    next();
}

export default {
    requireAuth,
    requireCliente,
    requirePremium,
    optionalAuth
};
