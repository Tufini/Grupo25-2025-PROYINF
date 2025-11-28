/**
 * ============================================================================
 * MOTOR DE SCORING CREDITICIO - UsmBank
 * ============================================================================
 *
 * Sistema de evaluación de riesgo crediticio basado en múltiples factores
 * ponderados. Implementa validaciones knock-out y cálculo de score sobre
 * 1000 puntos para determinar aprobación, rechazo o condiciones especiales.
 *
 * @author UsmBank - Equipo de Riesgo
 * @version 1.0.0
 */
// ============================================================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================================================
/**
 * Límites de edad aceptables
 */
const EDAD_MINIMA = 18;
const EDAD_MAXIMA = 75;
/**
 * Ingreso mínimo requerido
 */
const INGRESO_MINIMO = 400000; // CLP
/**
 * Límites de RCI (Relación Cuota/Ingreso)
 */
const RCI_EXCELENTE = 0.15; // 15%
const RCI_BUENO = 0.25; // 25%
const RCI_ACEPTABLE = 0.40; // 40%
const RCI_MAXIMO_APROBACION = 0.35; // 35% para cálculo de capacidad máxima
/**
 * Umbrales de score
 */
const SCORE_RECHAZO = 550;
const SCORE_CONDICIONAL = 700;
const SCORE_PREMIUM = 850;
/**
 * Tasas de interés mensuales
 */
const TASA_ESTANDAR = 0.011; // 1.1% mensual
const TASA_PREMIUM = 0.009; // 0.9% mensual (clientes premium)
const TASA_CONDICIONAL = 0.013; // 1.3% mensual (aprobación condicional)
/**
 * Factor de reducción para aprobación condicional
 */
const FACTOR_REDUCCION_CONDICIONAL = 0.70; // 70% del monto solicitado
// ============================================================================
// CLASE PRINCIPAL: MOTOR DE SCORING
// ============================================================================
export class ScoringEngine {
    /**
     * Evalúa el riesgo crediticio de un solicitante
     *
     * @param userData - Datos del usuario solicitante
     * @param loanRequest - Detalles de la solicitud de crédito
     * @returns Resultado completo de la evaluación
     */
    static evaluateRisk(userData, loanRequest) {
        // FASE 1: VALIDACIONES KNOCK-OUT (Rechazo Inmediato)
        const knockoutResult = this.checkKnockoutConditions(userData);
        if (knockoutResult) {
            return knockoutResult;
        }
        // FASE 2: CÁLCULO DE CUOTA MENSUAL
        const tasaMensual = loanRequest.tasaMensual || TASA_ESTANDAR;
        const cuotaMensual = this.calculateMonthlyPayment(loanRequest.montoSolicitado, tasaMensual, loanRequest.plazoMeses);
        // FASE 3: CÁLCULO DEL SCORE POR COMPONENTES
        const cargaFinanciera = this.evaluateCargaFinanciera(cuotaMensual, userData.otrasDeudas, userData.ingresoLiquido);
        const estabilidadLaboral = this.evaluateEstabilidadLaboral(userData.tipoContrato, userData.antiguedadLaboral);
        const patrimonioYPerfil = this.evaluatePatrimonioYPerfil(userData.esPropietario, userData.esProfesional);
        const historialCrediticio = this.evaluateHistorialCrediticio(userData.historialCrediticio);
        // FASE 4: SCORE TOTAL
        const scoreTotal = cargaFinanciera.puntos +
            estabilidadLaboral.puntos +
            patrimonioYPerfil.puntos +
            historialCrediticio.puntos;
        // FASE 5: CÁLCULO DE CAPACIDAD MÁXIMA
        const capacidadMaxima = this.calculateMaxCapacity(userData.ingresoLiquido, userData.otrasDeudas, loanRequest.plazoMeses, tasaMensual);
        // FASE 6: DETERMINACIÓN DEL RESULTADO
        return this.determineResult(scoreTotal, loanRequest.montoSolicitado, capacidadMaxima, cuotaMensual, {
            cargaFinanciera,
            estabilidadLaboral,
            patrimonioYPerfil,
            historialCrediticio
        }, userData, loanRequest);
    }
    // ==========================================================================
    // VALIDACIONES KNOCK-OUT
    // ==========================================================================
    /**
     * Verifica condiciones de rechazo inmediato (knock-out)
     *
     * @param userData - Datos del usuario
     * @returns Resultado de rechazo o null si pasa las validaciones
     */
    static checkKnockoutConditions(userData) {
        const riskFactors = [];
        // 1. VALIDACIÓN DE EDAD
        if (userData.edad < EDAD_MINIMA || userData.edad > EDAD_MAXIMA) {
            riskFactors.push({
                codigo: 'KO-001',
                descripcion: `Edad fuera del rango permitido (${EDAD_MINIMA}-${EDAD_MAXIMA} años)`,
                impacto: 'CRITICO'
            });
        }
        // 2. VALIDACIÓN DE DEUDA MOROSA
        if (userData.tieneDeudaMorosa) {
            riskFactors.push({
                codigo: 'KO-002',
                descripcion: 'Registro de deuda morosa vigente en sistema de información comercial (DICOM)',
                impacto: 'CRITICO'
            });
        }
        // 3. VALIDACIÓN DE INGRESO MÍNIMO
        if (userData.ingresoLiquido < INGRESO_MINIMO) {
            riskFactors.push({
                codigo: 'KO-003',
                descripcion: `Ingreso líquido inferior al mínimo requerido ($${INGRESO_MINIMO.toLocaleString('es-CL')} CLP)`,
                impacto: 'CRITICO'
            });
        }
        // Si hay factores de knock-out, retornar rechazo inmediato
        if (riskFactors.length > 0) {
            return {
                score: 0,
                status: 'RECHAZADO',
                maxAmount: 0,
                montoAprobado: 0,
                tasaOfrecida: 0,
                cuotaEstimada: 0,
                riskFactors,
                breakdown: null,
                mensaje: 'Solicitud rechazada por no cumplir con requisitos mínimos obligatorios',
                recomendaciones: this.generateRecommendations(riskFactors, userData)
            };
        }
        return null;
    }
    // ==========================================================================
    // EVALUACIÓN DE COMPONENTES DEL SCORE
    // ==========================================================================
    /**
     * A. CARGA FINANCIERA (400 pts máximo)
     * Evalúa la capacidad de pago mediante el cálculo del RCI
     *
     * @param cuotaSolicitada - Cuota mensual del crédito solicitado
     * @param otrasDeudas - Suma de otras cuotas mensuales
     * @param ingresoLiquido - Ingreso líquido mensual
     * @returns Evaluación de carga financiera
     */
    static evaluateCargaFinanciera(cuotaSolicitada, otrasDeudas, ingresoLiquido) {
        // Calcular RCI (Relación Cuota/Ingreso)
        const totalDeudas = cuotaSolicitada + otrasDeudas;
        const rci = totalDeudas / ingresoLiquido;
        const rciPorcentaje = rci * 100;
        let puntos;
        let detalle;
        if (rci < RCI_EXCELENTE) {
            // RCI < 15%: Capacidad de pago excelente
            puntos = 400;
            detalle = `Excelente capacidad de pago (RCI: ${rciPorcentaje.toFixed(1)}%)`;
        }
        else if (rci < RCI_BUENO) {
            // RCI 15% - 25%: Capacidad de pago buena
            puntos = 300;
            detalle = `Buena capacidad de pago (RCI: ${rciPorcentaje.toFixed(1)}%)`;
        }
        else if (rci < RCI_ACEPTABLE) {
            // RCI 25% - 40%: Capacidad de pago aceptable con reservas
            puntos = 150;
            detalle = `Capacidad de pago ajustada (RCI: ${rciPorcentaje.toFixed(1)}%)`;
        }
        else {
            // RCI > 40%: Alto riesgo de sobreendeudamiento
            puntos = 0;
            detalle = `Alto riesgo de sobreendeudamiento (RCI: ${rciPorcentaje.toFixed(1)}%)`;
        }
        return {
            puntos,
            maximo: 400,
            rci: rciPorcentaje,
            detalle
        };
    }
    /**
     * B. ESTABILIDAD LABORAL Y CONTRATO (250 pts máximo)
     * Evalúa la estabilidad y calidad del empleo
     *
     * @param tipoContrato - Tipo de contrato laboral
     * @param antiguedadMeses - Antigüedad laboral en meses
     * @returns Evaluación de estabilidad laboral
     */
    static evaluateEstabilidadLaboral(tipoContrato, antiguedadMeses) {
        let puntos;
        let detalle;
        if (tipoContrato === 'INDEFINIDO' && antiguedadMeses >= 24) {
            // Contrato indefinido + 2+ años: Máxima estabilidad
            puntos = 250;
            detalle = `Contrato indefinido con ${antiguedadMeses} meses de antigüedad (excelente estabilidad)`;
        }
        else if (tipoContrato === 'INDEFINIDO' && antiguedadMeses >= 6) {
            // Contrato indefinido + 6+ meses: Buena estabilidad
            puntos = 150;
            detalle = `Contrato indefinido con ${antiguedadMeses} meses de antigüedad (buena estabilidad)`;
        }
        else if (tipoContrato === 'INDEPENDIENTE' && antiguedadMeses >= 12) {
            // Independiente con continuidad: Estabilidad moderada
            puntos = 100;
            detalle = `Trabajador independiente con ${antiguedadMeses} meses de actividad continua`;
        }
        else if (tipoContrato === 'PLAZO_FIJO' || antiguedadMeses < 6) {
            // Contrato temporal o baja antigüedad: Estabilidad limitada
            puntos = 50;
            detalle = `${tipoContrato === 'PLAZO_FIJO' ? 'Contrato a plazo fijo' : 'Baja antigüedad laboral'} (${antiguedadMeses} meses)`;
        }
        else {
            // Temporal o situación atípica
            puntos = 50;
            detalle = `Situación laboral temporal (${antiguedadMeses} meses)`;
        }
        return {
            puntos,
            maximo: 250,
            detalle
        };
    }
    /**
     * C. PATRIMONIO Y PERFIL (150 pts máximo)
     * Evalúa activos y nivel educacional
     *
     * @param esPropietario - Indica si posee bienes inmuebles o vehículo
     * @param esProfesional - Indica si posee título profesional
     * @returns Evaluación de patrimonio y perfil
     */
    static evaluatePatrimonioYPerfil(esPropietario, esProfesional) {
        let puntos = 0;
        const detalles = [];
        // Propiedad de bienes: +100 pts
        if (esPropietario) {
            puntos += 100;
            detalles.push('Propietario de bien raíz o vehículo (+100 pts)');
        }
        // Profesional universitario: +50 pts
        if (esProfesional) {
            puntos += 50;
            detalles.push('Profesional universitario (+50 pts)');
        }
        const detalle = detalles.length > 0
            ? detalles.join(', ')
            : 'Sin respaldos patrimoniales o profesionales declarados';
        return {
            puntos,
            maximo: 150,
            detalle
        };
    }
    /**
     * D. HISTORIAL CREDITICIO (200 pts máximo)
     * Evalúa comportamiento de pago histórico (simulado)
     *
     * @param historial - Nivel de historial crediticio (opcional)
     * @returns Evaluación de historial crediticio
     */
    static evaluateHistorialCrediticio(historial) {
        // Si no se proporciona historial, simular uno aleatorio ponderado
        const nivel = historial || this.simulateCreditHistory();
        let puntos;
        let detalle;
        switch (nivel) {
            case 'IMPECABLE':
                // Comportamiento de pago perfecto
                puntos = 200;
                detalle = 'Historial crediticio impecable sin atrasos registrados';
                break;
            case 'ATRASOS_OCASIONALES':
                // Algunos atrasos menores (bajo impacto)
                puntos = 100;
                detalle = 'Historial con algunos atrasos ocasionales de bajo impacto';
                break;
            case 'PROBLEMAS_MENORES':
                // Problemas de pago menores
                puntos = 50;
                detalle = 'Historial con problemas menores de pago';
                break;
            case 'DESCONOCIDO':
            default:
                // Sin historial previo (cliente nuevo)
                puntos = 80;
                detalle = 'Cliente sin historial crediticio previo (puntuación neutral)';
                break;
        }
        return {
            puntos,
            maximo: 200,
            nivel,
            detalle
        };
    }
    // ==========================================================================
    // CÁLCULOS FINANCIEROS
    // ==========================================================================
    /**
     * Calcula la cuota mensual usando sistema de amortización francesa
     *
     * Fórmula: Cuota = P * [i * (1 + i)^n] / [(1 + i)^n - 1]
     * Donde:
     *   P = Monto del préstamo
     *   i = Tasa de interés mensual (decimal)
     *   n = Número de cuotas
     *
     * @param monto - Monto del crédito
     * @param tasaMensual - Tasa de interés mensual (decimal, ej: 0.011 = 1.1%)
     * @param plazoMeses - Plazo en meses
     * @returns Cuota mensual
     */
    static calculateMonthlyPayment(monto, tasaMensual, plazoMeses) {
        if (tasaMensual === 0) {
            // Si no hay interés, es simplemente el monto dividido por el plazo
            return monto / plazoMeses;
        }
        // Aplicar fórmula de amortización francesa
        const factor = Math.pow(1 + tasaMensual, plazoMeses);
        const cuota = monto * (tasaMensual * factor) / (factor - 1);
        return cuota;
    }
    /**
     * Calcula la capacidad máxima de endeudamiento del solicitante
     *
     * Regla: La cuota del nuevo crédito + otras deudas no debe superar
     * el 35% del ingreso líquido mensual
     *
     * @param ingresoLiquido - Ingreso líquido mensual
     * @param otrasDeudas - Suma de otras cuotas mensuales
     * @param plazoMeses - Plazo deseado en meses
     * @param tasaMensual - Tasa de interés mensual
     * @returns Monto máximo que se puede prestar
     */
    static calculateMaxCapacity(ingresoLiquido, otrasDeudas, plazoMeses, tasaMensual = TASA_ESTANDAR) {
        // Calcular cuota máxima permitida (35% del ingreso menos otras deudas)
        const cuotaMaximaPermitida = (ingresoLiquido * RCI_MAXIMO_APROBACION) - otrasDeudas;
        // Si ya está sobre-endeudado, capacidad = 0
        if (cuotaMaximaPermitida <= 0) {
            return 0;
        }
        // Calcular monto máximo que genera esa cuota
        // Despejando de la fórmula de amortización francesa:
        // Monto = Cuota * [(1 + i)^n - 1] / [i * (1 + i)^n]
        if (tasaMensual === 0) {
            return cuotaMaximaPermitida * plazoMeses;
        }
        const factor = Math.pow(1 + tasaMensual, plazoMeses);
        const montoMaximo = cuotaMaximaPermitida * (factor - 1) / (tasaMensual * factor);
        return Math.floor(montoMaximo);
    }
    // ==========================================================================
    // DETERMINACIÓN DEL RESULTADO FINAL
    // ==========================================================================
    /**
     * Determina el resultado final de la evaluación basándose en el score
     *
     * @param score - Score total calculado
     * @param montoSolicitado - Monto solicitado por el cliente
     * @param capacidadMaxima - Capacidad máxima calculada
     * @param cuotaEstimada - Cuota mensual estimada
     * @param breakdown - Desglose de puntos por componente
     * @param userData - Datos del usuario
     * @param loanRequest - Solicitud de crédito
     * @returns Resultado completo de la evaluación
     */
    static determineResult(score, montoSolicitado, capacidadMaxima, cuotaEstimada, breakdown, userData, loanRequest) {
        const riskFactors = [];
        let status;
        let montoAprobado;
        let tasaOfrecida;
        let mensaje;
        const recomendaciones = [];
        // CASO 1: SCORE < 550 - RECHAZADO
        if (score < SCORE_RECHAZO) {
            status = 'RECHAZADO';
            montoAprobado = 0;
            tasaOfrecida = 0;
            mensaje = 'Solicitud rechazada por nivel de riesgo alto';
            // Identificar factores de riesgo
            if (breakdown.cargaFinanciera.puntos < 150) {
                riskFactors.push({
                    codigo: 'RF-001',
                    descripcion: `Alta carga financiera (RCI: ${breakdown.cargaFinanciera.rci.toFixed(1)}%)`,
                    impacto: 'ALTO'
                });
                recomendaciones.push('Reducir deudas existentes antes de solicitar nuevo crédito');
            }
            if (breakdown.estabilidadLaboral.puntos < 100) {
                riskFactors.push({
                    codigo: 'RF-002',
                    descripcion: 'Baja estabilidad laboral',
                    impacto: 'ALTO'
                });
                recomendaciones.push('Aumentar antigüedad laboral o buscar contrato indefinido');
            }
            if (breakdown.historialCrediticio.puntos < 100) {
                riskFactors.push({
                    codigo: 'RF-003',
                    descripcion: 'Historial crediticio con incidencias',
                    impacto: 'MEDIO'
                });
                recomendaciones.push('Mejorar comportamiento de pago en créditos existentes');
            }
            recomendaciones.push(`Tu capacidad máxima de endeudamiento es de $${capacidadMaxima.toLocaleString('es-CL')} CLP`);
            // CASO 2: SCORE 550-699 - APROBACIÓN CONDICIONAL
        }
        else if (score < SCORE_CONDICIONAL) {
            status = 'CONDICIONAL';
            // Aprobar solo el 70% del monto solicitado o la capacidad máxima (el menor)
            const montoPropuesto = Math.min(montoSolicitado * FACTOR_REDUCCION_CONDICIONAL, capacidadMaxima);
            montoAprobado = Math.floor(montoPropuesto);
            tasaOfrecida = TASA_CONDICIONAL;
            mensaje = `Aprobación condicional: ${(FACTOR_REDUCCION_CONDICIONAL * 100)}% del monto solicitado`;
            riskFactors.push({
                codigo: 'RC-001',
                descripcion: 'Score en rango medio - requiere condiciones especiales',
                impacto: 'MEDIO'
            });
            recomendaciones.push('Considera solicitar un aval para mejorar las condiciones');
            recomendaciones.push('Puedes optar por un plazo mayor para reducir la cuota mensual');
            if (montoAprobado < montoSolicitado) {
                recomendaciones.push(`Monto ajustado a $${montoAprobado.toLocaleString('es-CL')} CLP para garantizar capacidad de pago`);
            }
            // CASO 3: SCORE 700-849 - APROBADO ESTÁNDAR
        }
        else if (score < SCORE_PREMIUM) {
            status = 'APROBADO';
            // Aprobar hasta el monto solicitado o capacidad máxima (el menor)
            montoAprobado = Math.min(montoSolicitado, capacidadMaxima);
            tasaOfrecida = TASA_ESTANDAR;
            mensaje = 'Crédito aprobado con condiciones estándar';
            if (montoAprobado < montoSolicitado) {
                riskFactors.push({
                    codigo: 'RA-001',
                    descripcion: 'Monto ajustado por capacidad de pago',
                    impacto: 'BAJO'
                });
                recomendaciones.push(`Monto ajustado a $${montoAprobado.toLocaleString('es-CL')} CLP según tu capacidad de pago`);
            }
            else {
                recomendaciones.push('¡Felicitaciones! Tu solicitud fue aprobada al 100%');
            }
            recomendaciones.push('Mantén un buen historial de pagos para futuros beneficios');
            // CASO 4: SCORE >= 850 - CLIENTE PREMIUM
        }
        else {
            status = 'APROBADO_PREMIUM';
            montoAprobado = Math.min(montoSolicitado, capacidadMaxima);
            tasaOfrecida = TASA_PREMIUM;
            mensaje = '🌟 Cliente Premium - Tasa preferencial del 0.9% mensual';
            recomendaciones.push('¡Eres un cliente premium! Disfruta de nuestra mejor tasa');
            recomendaciones.push('Tienes acceso prioritario a nuevos productos financieros');
            if (montoAprobado < montoSolicitado) {
                recomendaciones.push(`Monto ajustado a $${montoAprobado.toLocaleString('es-CL')} CLP según tu capacidad de pago`);
            }
        }
        // Recalcular cuota con tasa aprobada si es diferente
        const cuotaFinal = montoAprobado > 0
            ? this.calculateMonthlyPayment(montoAprobado, tasaOfrecida, loanRequest.plazoMeses)
            : 0;
        return {
            score: Math.round(score),
            status,
            maxAmount: capacidadMaxima,
            montoAprobado,
            tasaOfrecida,
            cuotaEstimada: Math.round(cuotaFinal),
            riskFactors,
            breakdown,
            mensaje,
            recomendaciones
        };
    }
    // ==========================================================================
    // UTILIDADES Y SIMULACIONES
    // ==========================================================================
    /**
     * Simula un historial crediticio aleatorio ponderado
     * (Para uso en demos cuando no se proporciona historial real)
     *
     * Distribución:
     * - 50% IMPECABLE
     * - 30% ATRASOS_OCASIONALES
     * - 15% DESCONOCIDO
     * - 5% PROBLEMAS_MENORES
     *
     * @returns Nivel de historial crediticio simulado
     */
    static simulateCreditHistory() {
        const random = Math.random();
        if (random < 0.50) {
            return 'IMPECABLE';
        }
        else if (random < 0.80) {
            return 'ATRASOS_OCASIONALES';
        }
        else if (random < 0.95) {
            return 'DESCONOCIDO';
        }
        else {
            return 'PROBLEMAS_MENORES';
        }
    }
    /**
     * Genera recomendaciones personalizadas basadas en factores de riesgo
     *
     * @param riskFactors - Factores de riesgo identificados
     * @param userData - Datos del usuario
     * @returns Array de recomendaciones
     */
    static generateRecommendations(riskFactors, userData) {
        const recomendaciones = [];
        // Analizar cada factor de knock-out
        riskFactors.forEach(factor => {
            switch (factor.codigo) {
                case 'KO-001': // Edad
                    if (userData.edad < EDAD_MINIMA) {
                        recomendaciones.push('Debes tener al menos 18 años para solicitar un crédito');
                    }
                    else {
                        recomendaciones.push('Edad máxima para créditos: 75 años');
                    }
                    break;
                case 'KO-002': // Deuda morosa
                    recomendaciones.push('Regulariza tus deudas morosas antes de solicitar nuevo crédito');
                    recomendaciones.push('Contacta a nuestro equipo de repactación: repactacion@usmbank.cl');
                    break;
                case 'KO-003': // Ingreso insuficiente
                    recomendaciones.push(`Ingreso mínimo requerido: $${INGRESO_MINIMO.toLocaleString('es-CL')} CLP`);
                    recomendaciones.push('Considera aumentar tus ingresos o solicitar con un co-deudor');
                    break;
            }
        });
        if (recomendaciones.length === 0) {
            recomendaciones.push('Consulta con nuestros ejecutivos para opciones alternativas');
        }
        return recomendaciones;
    }
    /**
     * Formatea un resultado para visualización en consola (debugging)
     *
     * @param result - Resultado de la evaluación
     * @returns String formateado para debugging
     */
    static formatResultForDebug(result) {
        const lines = [
            '='.repeat(80),
            'RESULTADO DE EVALUACIÓN CREDITICIA',
            '='.repeat(80),
            `Score: ${result.score}/1000`,
            `Estado: ${result.status}`,
            `Monto Aprobado: $${result.montoAprobado.toLocaleString('es-CL')} CLP`,
            `Capacidad Máxima: $${result.maxAmount.toLocaleString('es-CL')} CLP`,
            `Tasa Ofrecida: ${(result.tasaOfrecida * 100).toFixed(2)}% mensual`,
            `Cuota Estimada: $${result.cuotaEstimada.toLocaleString('es-CL')} CLP`,
            '',
            `Mensaje: ${result.mensaje}`,
            ''
        ];
        if (result.breakdown) {
            lines.push('DESGLOSE DEL SCORE:');
            lines.push(`  Carga Financiera: ${result.breakdown.cargaFinanciera.puntos}/${result.breakdown.cargaFinanciera.maximo} pts`);
            lines.push(`    ${result.breakdown.cargaFinanciera.detalle}`);
            lines.push(`  Estabilidad Laboral: ${result.breakdown.estabilidadLaboral.puntos}/${result.breakdown.estabilidadLaboral.maximo} pts`);
            lines.push(`    ${result.breakdown.estabilidadLaboral.detalle}`);
            lines.push(`  Patrimonio y Perfil: ${result.breakdown.patrimonioYPerfil.puntos}/${result.breakdown.patrimonioYPerfil.maximo} pts`);
            lines.push(`    ${result.breakdown.patrimonioYPerfil.detalle}`);
            lines.push(`  Historial Crediticio: ${result.breakdown.historialCrediticio.puntos}/${result.breakdown.historialCrediticio.maximo} pts`);
            lines.push(`    ${result.breakdown.historialCrediticio.detalle}`);
            lines.push('');
        }
        if (result.riskFactors.length > 0) {
            lines.push('FACTORES DE RIESGO:');
            result.riskFactors.forEach(factor => {
                lines.push(`  [${factor.codigo}] ${factor.descripcion} (Impacto: ${factor.impacto})`);
            });
            lines.push('');
        }
        if (result.recomendaciones.length > 0) {
            lines.push('RECOMENDACIONES:');
            result.recomendaciones.forEach((rec, idx) => {
                lines.push(`  ${idx + 1}. ${rec}`);
            });
        }
        lines.push('='.repeat(80));
        return lines.join('\n');
    }
}
// ============================================================================
// EXPORTS ADICIONALES
// ============================================================================
/**
 * Función auxiliar exportada para cálculo rápido de capacidad máxima
 */
export const calculateMaxCapacity = ScoringEngine.calculateMaxCapacity;
/**
 * Función auxiliar exportada para evaluación de riesgo
 */
export const evaluateRisk = ScoringEngine.evaluateRisk;
/**
 * Constantes exportadas para uso externo
 */
export const SCORING_CONSTANTS = {
    EDAD_MINIMA,
    EDAD_MAXIMA,
    INGRESO_MINIMO,
    RCI_EXCELENTE,
    RCI_BUENO,
    RCI_ACEPTABLE,
    RCI_MAXIMO_APROBACION,
    SCORE_RECHAZO,
    SCORE_CONDICIONAL,
    SCORE_PREMIUM,
    TASA_ESTANDAR,
    TASA_PREMIUM,
    TASA_CONDICIONAL,
    FACTOR_REDUCCION_CONDICIONAL
};
