/**
 * Authentication Service
 * Lógica de negocio para autenticación y autorización
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import usuarioRepository from '../repositories/usuario.repository.js';
import clienteRepository from '../repositories/cliente.repository.js';
import { jwtConfig } from '../config/jwt.js';
import { validarDatosRegistro, formatearRut } from '../utils/validators.js';
import { getClient } from '../config/database.js';

const SALT_ROUNDS = 10;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 15;

export class AuthService {
    /**
     * Registrar nuevo usuario
     */
    async register(userData) {
        const { email, password, nombre, apellido, rut, telefono, direccion, ingresos_mensuales } = userData;

        // Validar datos
        const validation = validarDatosRegistro(userData);
        if (!validation.valido) {
            throw {
                status: 400,
                message: 'Datos de registro inválidos',
                errores: validation.errores
            };
        }

        // Verificar si email ya existe
        const emailExists = await usuarioRepository.emailExists(email);
        if (emailExists) {
            throw {
                status: 409,
                message: 'El email ya está registrado'
            };
        }

        // Formatear RUT para consistencia
        const rutFormateado = formatearRut(rut);

        // Verificar si RUT ya existe
        const rutExists = await clienteRepository.rutExists(rutFormateado);
        if (rutExists) {
            throw {
                status: 409,
                message: 'El RUT ya está registrado'
            };
        }

        // Hashear password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Crear usuario y cliente en una transacción
        const client = await getClient();

        try {
            await client.query('BEGIN');

            // Crear usuario
            const usuario = await usuarioRepository.create({
                email,
                passwordHash,
                nombre,
                apellido
            });

            // Crear cliente
            const cliente = await clienteRepository.create({
                usuarioId: usuario.id,
                rut: rutFormateado,
                telefono: telefono || null,
                direccion: direccion || null,
                ingresosMensuales: ingresos_mensuales || 0,
                tipo: 'REGULAR'
            });

            await client.query('COMMIT');

            // Generar token
            const token = this.generateToken(usuario);

            return {
                usuario: {
                    id: usuario.id,
                    email: usuario.email,
                    nombre: usuario.nombre,
                    apellido: usuario.apellido
                },
                cliente: {
                    id: cliente.id,
                    rut: cliente.rut,
                    tipo: cliente.tipo
                },
                token
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Iniciar sesión
     */
    async login(email, password) {
        // Buscar usuario
        const usuario = await usuarioRepository.findByEmail(email);

        if (!usuario) {
            throw {
                status: 401,
                message: 'Credenciales inválidas'
            };
        }

        // Verificar si está bloqueado
        const locked = await usuarioRepository.isUserLocked(usuario.id);
        if (locked.bloqueado) {
            throw {
                status: 403,
                message: `Cuenta bloqueada temporalmente. Intente de nuevo después de ${new Date(locked.bloqueado_hasta).toLocaleTimeString()}`
            };
        }

        // Verificar si está activo
        if (!usuario.activo) {
            throw {
                status: 403,
                message: 'Cuenta desactivada. Contacte a soporte'
            };
        }

        // Verificar password
        const passwordMatch = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordMatch) {
            // Incrementar intentos fallidos
            const intentos = await usuarioRepository.incrementLoginAttempts(usuario.id);

            if (intentos >= MAX_LOGIN_ATTEMPTS) {
                await usuarioRepository.lockUser(usuario.id, LOCK_TIME_MINUTES);
                throw {
                    status: 403,
                    message: `Demasiados intentos fallidos. Cuenta bloqueada por ${LOCK_TIME_MINUTES} minutos`
                };
            }

            throw {
                status: 401,
                message: 'Credenciales inválidas',
                intentosRestantes: MAX_LOGIN_ATTEMPTS - intentos
            };
        }

        // Login exitoso - resetear intentos y actualizar último acceso
        await usuarioRepository.resetLoginAttempts(usuario.id);
        await usuarioRepository.updateLastAccess(usuario.id);

        // Obtener información completa del cliente
        const usuarioCompleto = await usuarioRepository.findByIdWithCliente(usuario.id);

        // Generar token
        const token = this.generateToken(usuario);

        return {
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                clienteId: usuarioCompleto.cliente_id,
                rut: usuarioCompleto.rut,
                tipoCliente: usuarioCompleto.tipo_cliente
            },
            token
        };
    }

    /**
     * Generar JWT token
     */
    generateToken(usuario) {
        const payload = {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre
        };

        return jwt.sign(payload, jwtConfig.secret, {
            expiresIn: jwtConfig.expiresIn,
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience
        });
    }

    /**
     * Verificar JWT token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, jwtConfig.secret, {
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience
            });
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw {
                    status: 401,
                    message: 'Token expirado'
                };
            } else if (error.name === 'JsonWebTokenError') {
                throw {
                    status: 401,
                    message: 'Token inválido'
                };
            }
            throw error;
        }
    }

    /**
     * Cambiar password
     */
    async changePassword(usuarioId, oldPassword, newPassword) {
        // Buscar usuario
        const usuario = await usuarioRepository.findByEmail(
            (await usuarioRepository.findById(usuarioId)).email
        );

        if (!usuario) {
            throw {
                status: 404,
                message: 'Usuario no encontrado'
            };
        }

        // Verificar password actual
        const passwordMatch = await bcrypt.compare(oldPassword, usuario.password_hash);

        if (!passwordMatch) {
            throw {
                status: 401,
                message: 'Contraseña actual incorrecta'
            };
        }

        // Validar nueva password
        const validation = require('../utils/validators.js').validarPassword(newPassword);
        if (!validation.valido) {
            throw {
                status: 400,
                message: 'Nueva contraseña no cumple los requisitos',
                errores: validation.errores
            };
        }

        // Hashear nueva password
        const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Actualizar password
        await usuarioRepository.updatePassword(usuarioId, newPasswordHash);

        return {
            message: 'Contraseña actualizada exitosamente'
        };
    }

    /**
     * Obtener perfil del usuario autenticado
     */
    async getProfile(usuarioId) {
        const usuario = await usuarioRepository.findByIdWithCliente(usuarioId);

        if (!usuario) {
            throw {
                status: 404,
                message: 'Usuario no encontrado'
            };
        }

        return {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            fechaRegistro: usuario.fecha_registro,
            ultimoAcceso: usuario.ultimo_acceso,
            cliente: {
                id: usuario.cliente_id,
                rut: usuario.rut,
                telefono: usuario.telefono,
                direccion: usuario.direccion,
                ingresosMensuales: usuario.ingresos_mensuales,
                scoreCredito: usuario.score_credito,
                tipo: usuario.tipo_cliente
            }
        };
    }
}

export default new AuthService();
