/**
 * Usuario Repository
 * Capa de acceso a datos para usuarios
 */

import { query, getClient } from '../config/database.js';

export class UsuarioRepository {
    /**
     * Crear un nuevo usuario
     */
    async create(userData) {
        const { email, passwordHash, nombre, apellido } = userData;

        const sql = `
            INSERT INTO usuarios (email, password_hash, nombre, apellido)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, nombre, apellido, fecha_registro, activo
        `;

        const result = await query(sql, [email, passwordHash, nombre, apellido]);
        return result.rows[0];
    }

    /**
     * Buscar usuario por email
     */
    async findByEmail(email) {
        const sql = `
            SELECT
                u.id, u.email, u.password_hash, u.nombre, u.apellido,
                u.fecha_registro, u.ultimo_acceso, u.activo,
                u.intentos_login, u.bloqueado_hasta
            FROM usuarios u
            WHERE u.email = $1
        `;

        const result = await query(sql, [email]);
        return result.rows[0] || null;
    }

    /**
     * Buscar usuario por ID
     */
    async findById(id) {
        const sql = `
            SELECT
                u.id, u.email, u.nombre, u.apellido,
                u.fecha_registro, u.ultimo_acceso, u.activo
            FROM usuarios u
            WHERE u.id = $1
        `;

        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }

    /**
     * Obtener usuario completo con información de cliente
     */
    async findByIdWithCliente(id) {
        const sql = `
            SELECT
                u.id, u.email, u.nombre, u.apellido,
                u.fecha_registro, u.ultimo_acceso, u.activo,
                c.id as cliente_id, c.rut, c.telefono, c.direccion,
                c.ingresos_mensuales, c.score_credito, c.tipo as tipo_cliente
            FROM usuarios u
            LEFT JOIN clientes c ON u.id = c.usuario_id
            WHERE u.id = $1
        `;

        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }

    /**
     * Actualizar último acceso
     */
    async updateLastAccess(id) {
        const sql = `
            UPDATE usuarios
            SET ultimo_acceso = CURRENT_TIMESTAMP
            WHERE id = $1
        `;

        await query(sql, [id]);
    }

    /**
     * Incrementar intentos de login fallidos
     */
    async incrementLoginAttempts(id) {
        const sql = `
            UPDATE usuarios
            SET intentos_login = intentos_login + 1
            WHERE id = $1
            RETURNING intentos_login
        `;

        const result = await query(sql, [id]);
        return result.rows[0].intentos_login;
    }

    /**
     * Resetear intentos de login
     */
    async resetLoginAttempts(id) {
        const sql = `
            UPDATE usuarios
            SET intentos_login = 0, bloqueado_hasta = NULL
            WHERE id = $1
        `;

        await query(sql, [id]);
    }

    /**
     * Bloquear usuario temporalmente
     */
    async lockUser(id, minutes = 15) {
        const sql = `
            UPDATE usuarios
            SET bloqueado_hasta = CURRENT_TIMESTAMP + INTERVAL '${minutes} minutes'
            WHERE id = $1
        `;

        await query(sql, [id]);
    }

    /**
     * Verificar si usuario está bloqueado
     */
    async isUserLocked(id) {
        const sql = `
            SELECT
                bloqueado_hasta > CURRENT_TIMESTAMP as bloqueado,
                bloqueado_hasta
            FROM usuarios
            WHERE id = $1
        `;

        const result = await query(sql, [id]);
        return result.rows[0] || { bloqueado: false };
    }

    /**
     * Actualizar perfil de usuario
     */
    async update(id, updateData) {
        const { nombre, apellido } = updateData;

        const sql = `
            UPDATE usuarios
            SET nombre = COALESCE($2, nombre),
                apellido = COALESCE($3, apellido)
            WHERE id = $1
            RETURNING id, email, nombre, apellido
        `;

        const result = await query(sql, [id, nombre, apellido]);
        return result.rows[0];
    }

    /**
     * Cambiar password
     */
    async updatePassword(id, newPasswordHash) {
        const sql = `
            UPDATE usuarios
            SET password_hash = $2
            WHERE id = $1
        `;

        await query(sql, [id, newPasswordHash]);
    }

    /**
     * Desactivar usuario
     */
    async deactivate(id) {
        const sql = `
            UPDATE usuarios
            SET activo = false
            WHERE id = $1
        `;

        await query(sql, [id]);
    }

    /**
     * Verificar si email ya existe
     */
    async emailExists(email) {
        const sql = `
            SELECT EXISTS(SELECT 1 FROM usuarios WHERE email = $1) as exists
        `;

        const result = await query(sql, [email]);
        return result.rows[0].exists;
    }
}

export default new UsuarioRepository();
