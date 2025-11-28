/**
 * Cuota Repository
 * Capa de acceso a datos para cuotas de crédito
 */

import { query, getClient } from '../config/database.js';

export class CuotaRepository {
    /**
     * Crear tabla de amortización (todas las cuotas del crédito)
     */
    async createTablaAmortizacion(creditoId, tablaAmortizacion) {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            const sql = `
                INSERT INTO cuotas (
                    credito_id, numero_cuota, monto_cuota, capital, interes,
                    saldo_pendiente, fecha_vencimiento, estado
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDIENTE')
            `;

            for (const cuota of tablaAmortizacion) {
                await client.query(sql, [
                    creditoId,
                    cuota.numeroCuota,
                    cuota.montoCuota,
                    cuota.capital,
                    cuota.interes,
                    cuota.saldoPendiente,
                    cuota.fechaVencimiento
                ]);
            }

            await client.query('COMMIT');
            console.log(`✅ Tabla de amortización creada: ${tablaAmortizacion.length} cuotas`);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtener todas las cuotas de un crédito
     */
    async findByCredito(creditoId) {
        const sql = `
            SELECT * FROM cuotas
            WHERE credito_id = $1
            ORDER BY numero_cuota ASC
        `;

        const result = await query(sql, [creditoId]);
        return result.rows;
    }

    /**
     * Buscar cuota por ID
     */
    async findById(id) {
        const sql = `
            SELECT * FROM cuotas
            WHERE id = $1
        `;

        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }

    /**
     * Obtener cuotas pendientes de un crédito
     */
    async findPendientesByCredito(creditoId) {
        const sql = `
            SELECT * FROM cuotas
            WHERE credito_id = $1
              AND estado = 'PENDIENTE'
            ORDER BY numero_cuota ASC
        `;

        const result = await query(sql, [creditoId]);
        return result.rows;
    }

    /**
     * Obtener próxima cuota a pagar
     */
    async getProximaCuota(creditoId) {
        const sql = `
            SELECT * FROM cuotas
            WHERE credito_id = $1
              AND estado = 'PENDIENTE'
            ORDER BY numero_cuota ASC
            LIMIT 1
        `;

        const result = await query(sql, [creditoId]);
        return result.rows[0] || null;
    }

    /**
     * Obtener cuotas vencidas (morosas)
     */
    async findVencidas(creditoId) {
        const sql = `
            SELECT * FROM cuotas
            WHERE credito_id = $1
              AND estado IN ('PENDIENTE', 'MORA')
              AND fecha_vencimiento < CURRENT_DATE
            ORDER BY numero_cuota ASC
        `;

        const result = await query(sql, [creditoId]);
        return result.rows;
    }

    /**
     * Marcar cuota como pagada
     */
    async marcarComoPagada(id) {
        const sql = `
            UPDATE cuotas
            SET estado = 'PAGADA',
                fecha_pago = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

        const result = await query(sql, [id]);
        return result.rows[0];
    }

    /**
     * Marcar cuota en mora
     */
    async marcarEnMora(id, diasMora, montoMora) {
        const sql = `
            UPDATE cuotas
            SET estado = 'MORA',
                dias_mora = $2,
                monto_mora = $3
            WHERE id = $1
            RETURNING *
        `;

        const result = await query(sql, [id, diasMora, montoMora]);
        return result.rows[0];
    }

    /**
     * Actualizar días de mora
     */
    async updateDiasMora() {
        const sql = `
            UPDATE cuotas
            SET dias_mora = EXTRACT(DAY FROM CURRENT_DATE - fecha_vencimiento)::INTEGER,
                estado = CASE
                    WHEN CURRENT_DATE > fecha_vencimiento AND estado = 'PENDIENTE'
                    THEN 'MORA'::estado_cuota
                    ELSE estado
                END
            WHERE estado IN ('PENDIENTE', 'MORA')
              AND fecha_vencimiento < CURRENT_DATE
            RETURNING *
        `;

        const result = await query(sql);
        return result.rows;
    }

    /**
     * Obtener resumen de cuotas de un crédito
     */
    async getResumen(creditoId) {
        const sql = `
            SELECT
                COUNT(*) as total_cuotas,
                COUNT(*) FILTER (WHERE estado = 'PAGADA') as cuotas_pagadas,
                COUNT(*) FILTER (WHERE estado = 'PENDIENTE') as cuotas_pendientes,
                COUNT(*) FILTER (WHERE estado = 'MORA') as cuotas_mora,
                COALESCE(SUM(monto_cuota) FILTER (WHERE estado = 'PAGADA'), 0) as monto_pagado,
                COALESCE(SUM(monto_cuota) FILTER (WHERE estado != 'PAGADA'), 0) as monto_pendiente,
                COALESCE(SUM(monto_mora), 0) as total_mora
            FROM cuotas
            WHERE credito_id = $1
        `;

        const result = await query(sql, [creditoId]);
        return result.rows[0];
    }

    /**
     * Obtener todas las cuotas vencidas del sistema
     */
    async findAllVencidas() {
        const sql = `
            SELECT
                cu.*,
                cr.cliente_id,
                c.rut,
                u.nombre,
                u.apellido,
                u.email
            FROM cuotas cu
            INNER JOIN creditos cr ON cu.credito_id = cr.id
            INNER JOIN clientes c ON cr.cliente_id = c.id
            INNER JOIN usuarios u ON c.usuario_id = u.id
            WHERE cu.estado IN ('PENDIENTE', 'MORA')
              AND cu.fecha_vencimiento < CURRENT_DATE
            ORDER BY cu.fecha_vencimiento ASC
        `;

        const result = await query(sql);
        return result.rows;
    }
}

export default new CuotaRepository();
