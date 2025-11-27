/**
 * Credito Controller
 * Controlador para endpoints de créditos
 */

import creditoService from '../services/credito.service.js';

export class CreditoController {
    /**
     * POST /api/simulaciones
     * Simular crédito
     */
    async simular(req, res) {
        const { monto, tasaInteres, plazoMeses } = req.body;

        // Validar que los campos existan
        if (!monto || tasaInteres === undefined || !plazoMeses) {
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'Monto, tasa de interés y plazo son requeridos'
            });
        }

        // Obtener clienteId si está autenticado (opcional)
        const clienteId = req.user?.clienteId || null;

        // Obtener IP y User Agent para tracking
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');

        const resultado = await creditoService.simular(
            { monto: parseFloat(monto), tasaInteres: parseFloat(tasaInteres), plazoMeses: parseInt(plazoMeses) },
            clienteId,
            ipAddress,
            userAgent
        );

        res.status(200).json({
            message: 'Simulación calculada exitosamente',
            data: resultado
        });
    }

    /**
     * POST /api/creditos
     * Solicitar crédito (con datos del wizard completo)
     */
    async solicitar(req, res) {
        // Si hay usuario autenticado, usar su ID
        const clienteId = req.user?.clienteId || null;
        
        const { 
            monto, 
            tasaInteres, 
            plazoMeses, 
            tipo, 
            simulacionId, 
            notas,
            // Nuevos campos del wizard
            tipo_credito,
            monto_solicitado,
            monto_aprobado,
            plazo_meses,
            tasa_interes,
            cuota_mensual,
            score_crediticio,
            estado_evaluacion,
            datos_cliente,
            scoring_detalles
        } = req.body;

        // Soportar ambos formatos: antiguo (monto, tasaInteres, plazoMeses) 
        // y nuevo (monto_solicitado, tasa_interes, plazo_meses)
        const montoFinal = monto_solicitado || monto;
        const tasaFinal = tasa_interes || tasaInteres;
        const plazoFinal = plazo_meses || plazoMeses;
        const tipoFinal = tipo_credito || tipo || 'CONSUMO';

        if (!montoFinal || tasaFinal === undefined || !plazoFinal) {
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'Monto, tasa de interés y plazo son requeridos'
            });
        }

        // Si no hay cliente autenticado pero hay datos_cliente, crear un registro temporal
        let clienteIdFinal = clienteId;
        
        if (!clienteId && datos_cliente) {
            // Para demo: permitir solicitud sin autenticación
            // En producción, esto debería requerir autenticación
            console.log('⚠️ Solicitud sin autenticación con datos:', datos_cliente);
        }

        const credito = await creditoService.solicitar(
            {
                monto: parseFloat(montoFinal),
                tasaInteres: parseFloat(tasaFinal),
                plazoMeses: parseInt(plazoFinal),
                tipo: tipoFinal,
                simulacionId,
                notas: notas || JSON.stringify({
                    score: score_crediticio,
                    estado: estado_evaluacion,
                    monto_aprobado: monto_aprobado,
                    cuota_mensual: cuota_mensual,
                    datos_cliente,
                    scoring_detalles
                })
            },
            clienteIdFinal
        );

        res.status(201).json({
            message: 'Solicitud de crédito creada exitosamente',
            data: credito
        });
    }

    /**
     * GET /api/creditos
     * Obtener todos los créditos del cliente autenticado
     */
    async obtenerCreditos(req, res) {
        const clienteId = req.user.clienteId;

        const creditos = await creditoService.obtenerCreditosCliente(clienteId);

        res.status(200).json({
            data: creditos
        });
    }

    /**
     * GET /api/creditos/:id
     * Obtener detalle de un crédito específico
     */
    async obtenerDetalle(req, res) {
        const creditoId = req.params.id;
        const clienteId = req.user.clienteId;

        const detalle = await creditoService.obtenerDetalle(creditoId, clienteId);

        res.status(200).json({
            data: detalle
        });
    }

    /**
     * POST /api/creditos/:id/aprobar
     * Aprobar un crédito (endpoint administrativo - futuro)
     */
    async aprobar(req, res) {
        const creditoId = req.params.id;
        const { montoAprobado } = req.body;

        const resultado = await creditoService.aprobar(creditoId, montoAprobado);

        res.status(200).json({
            message: 'Crédito aprobado exitosamente',
            data: resultado
        });
    }

    /**
     * POST /api/creditos/:id/desembolsar
     * Desembolsar un crédito aprobado (endpoint administrativo - futuro)
     */
    async desembolsar(req, res) {
        const creditoId = req.params.id;

        const resultado = await creditoService.desembolsar(creditoId);

        res.status(200).json({
            message: 'Crédito desembolsado exitosamente',
            data: resultado
        });
    }

    /**
     * POST /api/creditos/:id/rechazar
     * Rechazar un crédito (endpoint administrativo - futuro)
     */
    async rechazar(req, res) {
        const creditoId = req.params.id;
        const { motivo } = req.body;

        const resultado = await creditoService.rechazar(creditoId, motivo);

        res.status(200).json({
            message: 'Crédito rechazado',
            data: resultado
        });
    }

    /**
     * GET /api/simulaciones
     * Obtener historial de simulaciones del cliente
     */
    async obtenerHistorialSimulaciones(req, res) {
        const clienteId = req.user.clienteId;
        const limit = parseInt(req.query.limit) || 10;

        const simulaciones = await creditoService.obtenerHistorialSimulaciones(clienteId, limit);

        res.status(200).json({
            data: simulaciones
        });
    }

    /**
     * GET /api/creditos/estadisticas
     * Obtener estadísticas del cliente
     */
    async obtenerEstadisticas(req, res) {
        const clienteId = req.user.clienteId;

        const estadisticas = await creditoService.obtenerEstadisticas(clienteId);

        res.status(200).json({
            data: estadisticas
        });
    }
}

export default new CreditoController();
