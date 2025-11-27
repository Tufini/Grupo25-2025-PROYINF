/**
 * Simulacion Repository
 * Capa de acceso a datos para simulaciones de crédito
 */

import { query } from '../config/database.js';

export class SimulacionRepository {
    /**
     * Crear una nueva simulación
     */
    async create(simulacionData) {
        const {
            clienteId,
            monto,
            tasaInteres,
            plazoMeses,
            cuotaMensual,
            totalPagar,
            ipAddress,
            userAgent
        } = simulacionData;

        const sql = `
            INSERT INTO simulaciones (
                cliente_id, monto, tasa_interes, plazo_meses,
                cuota_mensual, total_pagar, ip_address, user_agent
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        const result = await query(sql, [
            clienteId || null,
            monto,
            tasaInteres,
            plazoMeses,
            cuotaMensual,
            totalPagar,
            ipAddress || null,
            userAgent || null
        ]);

        return result.rows[0];
    }

    /**
     * Buscar simulación por ID
     */
    async findById(id) {
        const sql = `
            SELECT * FROM simulaciones
            WHERE id = $1
        `;

        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }

    /**
     * Obtener simulaciones de un cliente
     */
    async findByCliente(clienteId, limit = 10) {
        const sql = `
            SELECT *
            FROM simulaciones
            WHERE cliente_id = $1
            ORDER BY fecha_simulacion DESC
            LIMIT $2
        `;

        const result = await query(sql, [clienteId, limit]);
        return result.rows;
    }

    /**
     * Marcar simulación como convertida a solicitud
     */
    async marcarComoConvertida(id, creditoId) {
        const sql = `
            UPDATE simulaciones
            SET convertido_a_solicitud = true
            WHERE id = $1
            RETURNING *
        `;

        const result = await query(sql, [id]);
        return result.rows[0];
    }

    /**
     * Obtener estadísticas de simulaciones
     */
    async getEstadisticas(clienteId) {
        const sql = `
            SELECT
                COUNT(*) as total_simulaciones,
                COUNT(*) FILTER (WHERE convertido_a_solicitud = true) as convertidas,
                AVG(monto) as monto_promedio,
                MAX(monto) as monto_maximo,
                MIN(monto) as monto_minimo
            FROM simulaciones
            WHERE cliente_id = $1
        `;

        const result = await query(sql, [clienteId]);
        return result.rows[0];
    }

    /**
     * Obtener simulaciones recientes (últimas 24 horas)
     */
    async getRecientes(clienteId) {
        const sql = `
            SELECT *
            FROM simulaciones
            WHERE cliente_id = $1
              AND fecha_simulacion > CURRENT_TIMESTAMP - INTERVAL '24 hours'
            ORDER BY fecha_simulacion DESC
        `;

        const result = await query(sql, [clienteId]);
        return result.rows;
    }
}

export default new SimulacionRepository();
