/**
 * Cliente Repository
 * Capa de acceso a datos para clientes
 */

import { query } from '../config/database.js';

export class ClienteRepository {
    /**
     * Crear un nuevo cliente
     */
    async create(clienteData) {
        const { usuarioId, rut, telefono, direccion, ingresosMensuales, tipo } = clienteData;

        const sql = `
            INSERT INTO clientes (
                usuario_id, rut, telefono, direccion, ingresos_mensuales, tipo
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, usuario_id, rut, telefono, tipo, score_credito, fecha_creacion
        `;

        const result = await query(sql, [
            usuarioId,
            rut,
            telefono || null,
            direccion || null,
            ingresosMensuales ?? 0,
            tipo || 'REGULAR'
        ]);

        return result.rows[0];
    }

    /**
     * Buscar cliente por ID
     */
    async findById(id) {
        const sql = `
            SELECT
                c.id, c.usuario_id, c.rut, c.telefono, c.direccion,
                c.ingresos_mensuales, c.score_credito, c.tipo,
                c.fecha_creacion
            FROM clientes c
            WHERE c.id = $1
        `;

        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }

    /**
     * Buscar cliente por usuario_id
     */
    async findByUsuarioId(usuarioId) {
        const sql = `
            SELECT
                c.id, c.usuario_id, c.rut, c.telefono, c.direccion,
                c.ingresos_mensuales, c.score_credito, c.tipo,
                c.fecha_creacion
            FROM clientes c
            WHERE c.usuario_id = $1
        `;

        const result = await query(sql, [usuarioId]);
        return result.rows[0] || null;
    }

    /**
     * Buscar cliente por RUT
     */
    async findByRut(rut) {
        const sql = `
            SELECT
                c.id, c.usuario_id, c.rut, c.telefono, c.direccion,
                c.ingresos_mensuales, c.score_credito, c.tipo,
                c.fecha_creacion
            FROM clientes c
            WHERE c.rut = $1
        `;

        const result = await query(sql, [rut]);
        return result.rows[0] || null;
    }

    /**
     * Obtener perfil completo del cliente con información de usuario
     */
    async getPerfilCompleto(clienteId) {
        const sql = `
            SELECT
                c.id, c.rut, c.telefono, c.direccion,
                c.ingresos_mensuales, c.score_credito, c.tipo,
                c.fecha_creacion,
                u.email, u.nombre, u.apellido, u.activo
            FROM clientes c
            INNER JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.id = $1
        `;

        const result = await query(sql, [clienteId]);
        return result.rows[0] || null;
    }

    /**
     * Actualizar información del cliente
     */
    async update(id, updateData) {
        const { telefono, direccion, ingresosMensuales } = updateData;

        const sql = `
            UPDATE clientes
            SET telefono = COALESCE($2, telefono),
                direccion = COALESCE($3, direccion),
                ingresos_mensuales = COALESCE($4, ingresos_mensuales)
            WHERE id = $1
            RETURNING id, rut, telefono, direccion, ingresos_mensuales, score_credito, tipo
        `;

        const result = await query(sql, [id, telefono, direccion, ingresosMensuales]);
        return result.rows[0];
    }

    /**
     * Actualizar score de crédito
     */
    async updateScoreCredito(id, nuevoScore) {
        const sql = `
            UPDATE clientes
            SET score_credito = $2
            WHERE id = $1
            RETURNING id, score_credito
        `;

        const result = await query(sql, [id, nuevoScore]);
        return result.rows[0];
    }

    /**
     * Actualizar tipo de cliente
     */
    async updateTipo(id, nuevoTipo) {
        const sql = `
            UPDATE clientes
            SET tipo = $2
            WHERE id = $1
            RETURNING id, tipo
        `;

        const result = await query(sql, [id, nuevoTipo]);
        return result.rows[0];
    }

    /**
     * Verificar si RUT ya existe
     */
    async rutExists(rut) {
        const sql = `
            SELECT EXISTS(SELECT 1 FROM clientes WHERE rut = $1) as exists
        `;

        const result = await query(sql, [rut]);
        return result.rows[0].exists;
    }

    /**
     * Obtener estadísticas del cliente
     */
    async getEstadisticas(clienteId) {
        const sql = `
            SELECT
                COUNT(DISTINCT cr.id) FILTER (WHERE cr.estado IN ('APROBADO', 'DESEMBOLSADO')) as creditos_activos,
                COUNT(DISTINCT cr.id) FILTER (WHERE cr.estado = 'CANCELADO') as creditos_cancelados,
                COALESCE(SUM(cr.monto_aprobado) FILTER (WHERE cr.estado IN ('APROBADO', 'DESEMBOLSADO')), 0) as monto_total_creditos,
                COUNT(DISTINCT s.id) as simulaciones_realizadas,
                COUNT(DISTINCT cb.id) as cuentas_bancarias
            FROM clientes c
            LEFT JOIN creditos cr ON c.id = cr.cliente_id
            LEFT JOIN simulaciones s ON c.id = s.cliente_id
            LEFT JOIN cuentas_bancarias cb ON c.id = cb.cliente_id AND cb.activa = true
            WHERE c.id = $1
            GROUP BY c.id
        `;

        const result = await query(sql, [clienteId]);
        return result.rows[0] || {
            creditos_activos: 0,
            creditos_cancelados: 0,
            monto_total_creditos: 0,
            simulaciones_realizadas: 0,
            cuentas_bancarias: 0
        };
    }
}

export default new ClienteRepository();
