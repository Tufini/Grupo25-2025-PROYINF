/**
 * Credit Calculator Utilities
 * Sistema Francés de Amortización
 */

/**
 * Calcular cuota mensual usando Sistema Francés
 * @param {number} monto - Monto del préstamo
 * @param {number} tasaAnual - Tasa de interés anual (ej: 4.5 para 4.5%)
 * @param {number} plazoMeses - Plazo en meses
 * @returns {number} Cuota mensual
 */
export function calcularCuotaMensual(monto, tasaAnual, plazoMeses) {
    const tasaMensual = tasaAnual / 100 / 12;

    if (tasaMensual === 0) {
        return monto / plazoMeses;
    }

    const cuota = monto * (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) /
                  (Math.pow(1 + tasaMensual, plazoMeses) - 1);

    return Math.round(cuota * 100) / 100; // Redondear a 2 decimales
}

/**
 * Calcular total a pagar
 * @param {number} cuotaMensual - Cuota mensual
 * @param {number} plazoMeses - Plazo en meses
 * @returns {number} Total a pagar
 */
export function calcularTotalPagar(cuotaMensual, plazoMeses) {
    return Math.round(cuotaMensual * plazoMeses * 100) / 100;
}

/**
 * Generar tabla de amortización completa
 * @param {number} monto - Monto del préstamo
 * @param {number} tasaAnual - Tasa de interés anual
 * @param {number} plazoMeses - Plazo en meses
 * @param {Date} fechaInicio - Fecha de inicio del crédito
 * @returns {Array} Tabla de amortización
 */
export function generarTablaAmortizacion(monto, tasaAnual, plazoMeses, fechaInicio = new Date()) {
    const cuotaMensual = calcularCuotaMensual(monto, tasaAnual, plazoMeses);
    const tasaMensual = tasaAnual / 100 / 12;
    let saldoPendiente = monto;
    const tabla = [];

    for (let i = 1; i <= plazoMeses; i++) {
        const interes = Math.round(saldoPendiente * tasaMensual * 100) / 100;
        const capital = Math.round((cuotaMensual - interes) * 100) / 100;
        saldoPendiente = Math.max(0, Math.round((saldoPendiente - capital) * 100) / 100);

        // Calcular fecha de vencimiento (agregar i meses a fechaInicio)
        const fechaVencimiento = new Date(fechaInicio);
        fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);

        tabla.push({
            numeroCuota: i,
            montoCuota: cuotaMensual,
            capital: capital,
            interes: interes,
            saldoPendiente: saldoPendiente,
            fechaVencimiento: fechaVencimiento.toISOString().split('T')[0] // Formato YYYY-MM-DD
        });
    }

    return tabla;
}

/**
 * Calcular interés total del crédito
 * @param {number} cuotaMensual - Cuota mensual
 * @param {number} plazoMeses - Plazo en meses
 * @param {number} monto - Monto del préstamo
 * @returns {number} Interés total
 */
export function calcularInteresTotal(cuotaMensual, plazoMeses, monto) {
    const totalPagar = cuotaMensual * plazoMeses;
    return Math.round((totalPagar - monto) * 100) / 100;
}

/**
 * Calcular monto de mora
 * @param {number} montoCuota - Monto de la cuota
 * @param {number} diasMora - Días de mora
 * @param {number} tasaMoraAnual - Tasa de mora anual (default 10%)
 * @returns {number} Monto de mora
 */
export function calcularMontoMora(montoCuota, diasMora, tasaMoraAnual = 10) {
    const tasaMoraDiaria = tasaMoraAnual / 100 / 365;
    const mora = montoCuota * tasaMoraDiaria * diasMora;
    return Math.round(mora * 100) / 100;
}

/**
 * Validar parámetros de crédito
 * @param {number} monto - Monto del préstamo
 * @param {number} tasaAnual - Tasa de interés anual
 * @param {number} plazoMeses - Plazo en meses
 * @returns {Object} {valido: boolean, errores: Array}
 */
export function validarParametrosCredito(monto, tasaAnual, plazoMeses) {
    const errores = [];

    if (!monto || monto <= 0) {
        errores.push('El monto debe ser mayor a 0');
    }

    if (monto > 100000000) {
        errores.push('El monto no puede superar los $100,000,000');
    }

    if (!tasaAnual || tasaAnual < 0) {
        errores.push('La tasa de interés debe ser mayor o igual a 0');
    }

    if (tasaAnual > 50) {
        errores.push('La tasa de interés no puede superar el 50%');
    }

    if (!plazoMeses || plazoMeses <= 0) {
        errores.push('El plazo debe ser mayor a 0 meses');
    }

    if (plazoMeses > 360) {
        errores.push('El plazo no puede superar los 360 meses (30 años)');
    }

    return {
        valido: errores.length === 0,
        errores
    };
}

/**
 * Calcular capacidad de endeudamiento
 * @param {number} ingresosMensuales - Ingresos mensuales del cliente
 * @param {number} porcentajeMaximo - Porcentaje máximo de endeudamiento (default 40%)
 * @returns {number} Capacidad de pago mensual
 */
export function calcularCapacidadPago(ingresosMensuales, porcentajeMaximo = 40) {
    return Math.round(ingresosMensuales * (porcentajeMaximo / 100) * 100) / 100;
}

/**
 * Verificar si el cliente puede pagar la cuota
 * @param {number} cuotaMensual - Cuota mensual del crédito
 * @param {number} ingresosMensuales - Ingresos mensuales del cliente
 * @param {number} cuotasExistentes - Suma de cuotas de otros créditos activos
 * @returns {Object} {puede: boolean, capacidadDisponible: number}
 */
export function verificarCapacidadPago(cuotaMensual, ingresosMensuales, cuotasExistentes = 0) {
    const capacidadTotal = calcularCapacidadPago(ingresosMensuales);
    const capacidadDisponible = capacidadTotal - cuotasExistentes;
    const puede = cuotaMensual <= capacidadDisponible;

    return {
        puede,
        capacidadTotal,
        capacidadDisponible,
        comprometido: cuotasExistentes,
        porcentajeComprometido: Math.round((cuotasExistentes / ingresosMensuales) * 10000) / 100
    };
}

export default {
    calcularCuotaMensual,
    calcularTotalPagar,
    generarTablaAmortizacion,
    calcularInteresTotal,
    calcularMontoMora,
    validarParametrosCredito,
    calcularCapacidadPago,
    verificarCapacidadPago
};
