/**
 * Credito Repository
 * Capa de acceso a datos para créditos bancarios
 */

import { query, getClient } from '../config/database.js';

export class CreditoRepository {
    /**
     * Crear una nueva solicitud de crédito
     */
    async create(creditoData) {
        const {
            clienteId,
            simulacionId,
            montoSolicitado,
            tasaInteres,
            plazoMeses,
            tipo,
            notas
        } = creditoData;

        const sql = `
            INSERT INTO creditos (
                cliente_id, simulacion_id, monto_solicitado,
                tasa_interes, plazo_meses, tipo, notas, estado
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDIENTE')
            RETURNING *
        `;

        const result = await query(sql, [
            clienteId,
            simulacionId || null,
            montoSolicitado,
            tasaInteres,
            plazoMeses,
            tipo,
            notas || null
        ]);

        return result.rows[0];
    }

    /**
     * Buscar crédito por ID
     */
    async findById(id) {
        const sql = `
            SELECT * FROM creditos
            WHERE id = $1
        `;

        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }

    /**
     * Obtener créditos de un cliente
     */
    async findByCliente(clienteId) {
        const sql = `
            SELECT
                cr.*,
                (SELECT COUNT(*) FROM cuotas WHERE credito_id = cr.id) as total_cuotas,
                (SELECT COUNT(*) FROM cuotas WHERE credito_id = cr.id AND estado = 'PAGADA') as cuotas_pagadas,
                (SELECT COUNT(*) FROM cuotas WHERE credito_id = cr.id AND estado = 'MORA') as cuotas_mora
            FROM creditos cr
            WHERE cr.cliente_id = $1
            ORDER BY cr.fecha_solicitud DESC
        `;

        const result = await query(sql, [clienteId]);
        return result.rows;
    }

    /**
     * Obtener créditos activos de un cliente
     */
    async findActivosByCliente(clienteId) {
        const sql = `
            SELECT * FROM creditos
            WHERE cliente_id = $1
              AND estado IN ('APROBADO', 'DESEMBOLSADO')
            ORDER BY fecha_solicitud DESC
        `;

        const result = await query(sql, [clienteId]);
        return result.rows;
    }

    /**
     * Aprobar crédito
     */
    async aprobar(id, montoAprobado, cuotaMensual, totalPagar) {
        const sql = `
            UPDATE creditos
            SET estado = 'APROBADO',
                monto_aprobado = $2,
                cuota_mensual = $3,
                total_pagar = $4,
                fecha_aprobacion = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

        const result = await query(sql, [id, montoAprobado, cuotaMensual, totalPagar]);
        return result.rows[0];
    }

    /**
     * Rechazar crédito
     */
    async rechazar(id, notas) {
        const sql = `
            UPDATE creditos
            SET estado = 'RECHAZADO',
                notas = COALESCE($2, notas)
            WHERE id = $1
            RETURNING *
        `;

        const result = await query(sql, [id, notas]);
        return result.rows[0];
    }

    /**
     * Desembolsar crédito
     */
    async desembolsar(id) {
        const sql = `
            UPDATE creditos
            SET estado = 'DESEMBOLSADO',
                fecha_desembolso = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

        const result = await query(sql, [id]);
        return result.rows[0];
    }

    /**
     * Cancelar crédito
     */
    async cancelar(id) {
        const sql = `
            UPDATE creditos
            SET estado = 'CANCELADO'
            WHERE id = $1
            RETURNING *
        `;

        const result = await query(sql, [id]);
        return result.rows[0];
    }

    /**
     * Actualizar estado de crédito
     */
    async updateEstado(id, nuevoEstado) {
        const sql = `
            UPDATE creditos
            SET estado = $2
            WHERE id = $1
            RETURNING *
        `;

        const result = await query(sql, [id, nuevoEstado]);
        return result.rows[0];
    }

    /**
     * Obtener crédito con información completa del cliente
     */
    async findByIdWithCliente(id) {
        const sql = `
            SELECT
                cr.*,
                c.rut, c.telefono, c.score_credito, c.tipo as tipo_cliente,
                u.nombre, u.apellido, u.email
            FROM creditos cr
            INNER JOIN clientes c ON cr.cliente_id = c.id
            INNER JOIN usuarios u ON c.usuario_id = u.id
            WHERE cr.id = $1
        `;

        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }

    /**
     * Obtener todos los créditos pendientes de aprobación
     */
    async findPendientes() {
        const sql = `
            SELECT
                cr.*,
                c.rut, c.score_credito, c.tipo as tipo_cliente,
                u.nombre, u.apellido, u.email
            FROM creditos cr
            INNER JOIN clientes c ON cr.cliente_id = c.id
            INNER JOIN usuarios u ON c.usuario_id = u.id
            WHERE cr.estado IN ('PENDIENTE', 'EVALUACION')
            ORDER BY cr.fecha_solicitud ASC
        `;

        const result = await query(sql);
        return result.rows;
    }

    /**
     * Obtener estadísticas de créditos por cliente
     */
    async getEstadisticasCliente(clienteId) {
        const sql = `
            SELECT
                COUNT(*) as total_creditos,
                COUNT(*) FILTER (WHERE estado = 'APROBADO') as aprobados,
                COUNT(*) FILTER (WHERE estado = 'RECHAZADO') as rechazados,
                COUNT(*) FILTER (WHERE estado = 'DESEMBOLSADO') as desembolsados,
                COALESCE(SUM(monto_aprobado) FILTER (WHERE estado IN ('APROBADO', 'DESEMBOLSADO')), 0) as monto_total,
                COALESCE(AVG(tasa_interes) FILTER (WHERE estado IN ('APROBADO', 'DESEMBOLSADO')), 0) as tasa_promedio
            FROM creditos
            WHERE cliente_id = $1
        `;

        const result = await query(sql, [clienteId]);
        return result.rows[0];
    }

    /**
     * Obtener resumen de deuda actual del cliente
     */
    async getResumenDeuda(clienteId) {
        const sql = `
            SELECT
                COUNT(DISTINCT cr.id) as creditos_activos,
                COALESCE(SUM(cr.cuota_mensual), 0) as cuota_mensual_total,
                COALESCE(SUM(
                    (SELECT SUM(saldo_pendiente)
                     FROM cuotas cu
                     WHERE cu.credito_id = cr.id
                       AND cu.estado != 'PAGADA'
                     LIMIT 1)
                ), 0) as deuda_total,
                COUNT(cu.id) FILTER (WHERE cu.estado = 'MORA') as cuotas_en_mora
            FROM creditos cr
            LEFT JOIN cuotas cu ON cr.id = cu.credito_id
            WHERE cr.cliente_id = $1
              AND cr.estado = 'DESEMBOLSADO'
            GROUP BY cr.cliente_id
        `;

        const result = await query(sql, [clienteId]);
        return result.rows[0] || {
            creditos_activos: 0,
            cuota_mensual_total: 0,
            deuda_total: 0,
            cuotas_en_mora: 0
        };
    }
}

export default new CreditoRepository();
