/**
 * Credito Service
 * Lógica de negocio para gestión de créditos
 */

import creditoRepository from '../repositories/credito.repository.js';
import clienteRepository from '../repositories/cliente.repository.js';
import simulacionRepository from '../repositories/simulacion.repository.js';
import cuotaRepository from '../repositories/cuota.repository.js';
import {
    calcularCuotaMensual,
    calcularTotalPagar,
    generarTablaAmortizacion,
    validarParametrosCredito,
    verificarCapacidadPago
} from '../utils/calculator.js';
import { validarSolicitudCredito } from '../utils/validators.js';

export class CreditoService {
    /**
     * Simular crédito
     */
    async simular(simulacionData, clienteId = null, ipAddress = null, userAgent = null) {
        const { monto, tasaInteres, plazoMeses } = simulacionData;

        // Validar parámetros
        const validation = validarParametrosCredito(monto, tasaInteres, plazoMeses);
        if (!validation.valido) {
            throw {
                status: 400,
                message: 'Parámetros de simulación inválidos',
                errores: validation.errores
            };
        }

        // Calcular cuota y total
        const cuotaMensual = calcularCuotaMensual(monto, tasaInteres, plazoMeses);
        const totalPagar = calcularTotalPagar(cuotaMensual, plazoMeses);

        // Guardar simulación en base de datos
        const simulacion = await simulacionRepository.create({
            clienteId,
            monto,
            tasaInteres,
            plazoMeses,
            cuotaMensual,
            totalPagar,
            ipAddress,
            userAgent
        });

        return {
            id: simulacion.id,
            monto,
            tasaInteres,
            plazoMeses,
            cuotaMensual,
            totalPagar,
            interesTotal: totalPagar - monto,
            fechaSimulacion: simulacion.fecha_simulacion
        };
    }

    /**
     * Solicitar crédito
     */
    async solicitar(solicitudData, clienteId) {
        const { monto, tasaInteres, plazoMeses, tipo, simulacionId, notas } = solicitudData;

        // Validar datos de solicitud
        const validation = validarSolicitudCredito({ monto, tasaInteres, plazoMeses, tipo });
        if (!validation.valido) {
            throw {
                status: 400,
                message: 'Datos de solicitud inválidos',
                errores: validation.errores
            };
        }

        // Obtener información del cliente
        const cliente = await clienteRepository.findById(clienteId);
        if (!cliente) {
            throw {
                status: 404,
                message: 'Cliente no encontrado'
            };
        }

        // Calcular cuota mensual
        const cuotaMensual = calcularCuotaMensual(monto, tasaInteres, plazoMeses);

        // Verificar capacidad de pago si hay ingresos registrados
        if (cliente.ingresos_mensuales) {
            // Obtener cuotas existentes
            const resumenDeuda = await creditoRepository.getResumenDeuda(clienteId);
            const cuotasExistentes = parseFloat(resumenDeuda.cuota_mensual_total);

            const capacidad = verificarCapacidadPago(
                cuotaMensual,
                cliente.ingresos_mensuales,
                cuotasExistentes
            );

            if (!capacidad.puede) {
                throw {
                    status: 400,
                    message: 'La cuota mensual excede su capacidad de pago',
                    detalles: {
                        cuotaSolicitada: cuotaMensual,
                        capacidadDisponible: capacidad.capacidadDisponible,
                        comprometido: capacidad.comprometido,
                        porcentajeComprometido: capacidad.porcentajeComprometido
                    }
                };
            }
        }

        // Crear solicitud de crédito
        const credito = await creditoRepository.create({
            clienteId,
            simulacionId,
            montoSolicitado: monto,
            tasaInteres,
            plazoMeses,
            tipo: tipo.toUpperCase(),
            notas
        });

        // Si hay simulación, marcarla como convertida
        if (simulacionId) {
            await simulacionRepository.marcarComoConvertida(simulacionId, credito.id);
        }

        return {
            id: credito.id,
            monto: credito.monto_solicitado,
            tasaInteres: credito.tasa_interes,
            plazoMeses: credito.plazo_meses,
            tipo: credito.tipo,
            estado: credito.estado,
            fechaSolicitud: credito.fecha_solicitud
        };
    }

    /**
     * Aprobar crédito
     */
    async aprobar(creditoId, montoAprobado = null) {
        const credito = await creditoRepository.findById(creditoId);

        if (!credito) {
            throw {
                status: 404,
                message: 'Crédito no encontrado'
            };
        }

        if (credito.estado !== 'PENDIENTE' && credito.estado !== 'EVALUACION') {
            throw {
                status: 400,
                message: `No se puede aprobar un crédito en estado ${credito.estado}`
            };
        }

        // Usar monto solicitado si no se especifica monto aprobado
        const monto = montoAprobado || credito.monto_solicitado;

        // Calcular cuota y total
        const cuotaMensual = calcularCuotaMensual(monto, credito.tasa_interes, credito.plazo_meses);
        const totalPagar = calcularTotalPagar(cuotaMensual, credito.plazo_meses);

        // Aprobar crédito
        const creditoAprobado = await creditoRepository.aprobar(
            creditoId,
            monto,
            cuotaMensual,
            totalPagar
        );

        return {
            id: creditoAprobado.id,
            montoAprobado: creditoAprobado.monto_aprobado,
            cuotaMensual: creditoAprobado.cuota_mensual,
            totalPagar: creditoAprobado.total_pagar,
            estado: creditoAprobado.estado,
            fechaAprobacion: creditoAprobado.fecha_aprobacion
        };
    }

    /**
     * Desembolsar crédito (generar tabla de amortización)
     */
    async desembolsar(creditoId) {
        const credito = await creditoRepository.findById(creditoId);

        if (!credito) {
            throw {
                status: 404,
                message: 'Crédito no encontrado'
            };
        }

        if (credito.estado !== 'APROBADO') {
            throw {
                status: 400,
                message: 'Solo se pueden desembolsar créditos aprobados'
            };
        }

        // Generar tabla de amortización
        const tablaAmortizacion = generarTablaAmortizacion(
            credito.monto_aprobado,
            credito.tasa_interes,
            credito.plazo_meses,
            new Date()
        );

        // Crear cuotas en la base de datos
        await cuotaRepository.createTablaAmortizacion(creditoId, tablaAmortizacion);

        // Actualizar estado del crédito a DESEMBOLSADO
        const creditoDesembolsado = await creditoRepository.desembolsar(creditoId);

        return {
            id: creditoDesembolsado.id,
            estado: creditoDesembolsado.estado,
            fechaDesembolso: creditoDesembolsado.fecha_desembolso,
            tablaAmortizacion: tablaAmortizacion
        };
    }

    /**
     * Rechazar crédito
     */
    async rechazar(creditoId, motivo) {
        const credito = await creditoRepository.findById(creditoId);

        if (!credito) {
            throw {
                status: 404,
                message: 'Crédito no encontrado'
            };
        }

        if (credito.estado !== 'PENDIENTE' && credito.estado !== 'EVALUACION') {
            throw {
                status: 400,
                message: `No se puede rechazar un crédito en estado ${credito.estado}`
            };
        }

        const creditoRechazado = await creditoRepository.rechazar(creditoId, motivo);

        return {
            id: creditoRechazado.id,
            estado: creditoRechazado.estado,
            motivo: creditoRechazado.notas
        };
    }

    /**
     * Obtener créditos de un cliente
     */
    async obtenerCreditosCliente(clienteId) {
        const creditos = await creditoRepository.findByCliente(clienteId);
        return creditos;
    }

    /**
     * Obtener detalle completo de un crédito
     */
    async obtenerDetalle(creditoId, clienteId) {
        const credito = await creditoRepository.findById(creditoId);

        if (!credito) {
            throw {
                status: 404,
                message: 'Crédito no encontrado'
            };
        }

        // Verificar que el crédito pertenece al cliente
        if (credito.cliente_id !== clienteId) {
            throw {
                status: 403,
                message: 'No tiene permisos para ver este crédito'
            };
        }

        // Obtener cuotas
        const cuotas = await cuotaRepository.findByCredito(creditoId);

        // Obtener resumen de cuotas
        const resumenCuotas = await cuotaRepository.getResumen(creditoId);

        return {
            credito: {
                id: credito.id,
                montoSolicitado: credito.monto_solicitado,
                montoAprobado: credito.monto_aprobado,
                tasaInteres: credito.tasa_interes,
                plazoMeses: credito.plazo_meses,
                cuotaMensual: credito.cuota_mensual,
                totalPagar: credito.total_pagar,
                tipo: credito.tipo,
                estado: credito.estado,
                fechaSolicitud: credito.fecha_solicitud,
                fechaAprobacion: credito.fecha_aprobacion,
                fechaDesembolso: credito.fecha_desembolso
            },
            resumenCuotas,
            cuotas: cuotas.map(c => ({
                numeroCuota: c.numero_cuota,
                montoCuota: c.monto_cuota,
                capital: c.capital,
                interes: c.interes,
                saldoPendiente: c.saldo_pendiente,
                fechaVencimiento: c.fecha_vencimiento,
                fechaPago: c.fecha_pago,
                estado: c.estado,
                diasMora: c.dias_mora,
                montoMora: c.monto_mora
            }))
        };
    }

    /**
     * Obtener historial de simulaciones del cliente
     */
    async obtenerHistorialSimulaciones(clienteId, limit = 10) {
        const simulaciones = await simulacionRepository.findByCliente(clienteId, limit);
        return simulaciones;
    }

    /**
     * Obtener estadísticas del cliente
     */
    async obtenerEstadisticas(clienteId) {
        const [estadisticasCreditos, resumenDeuda] = await Promise.all([
            creditoRepository.getEstadisticasCliente(clienteId),
            creditoRepository.getResumenDeuda(clienteId)
        ]);

        return {
            creditos: estadisticasCreditos,
            deuda: resumenDeuda
        };
    }
}

export default new CreditoService();
