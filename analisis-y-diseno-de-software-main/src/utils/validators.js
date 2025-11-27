/**
 * Validation Utilities
 * Funciones de validación de datos
 */

/**
 * Validar formato de email
 * @param {string} email
 * @returns {boolean}
 */
export function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validar fortaleza de password
 * @param {string} password
 * @returns {Object} {valido: boolean, errores: Array}
 */
export function validarPassword(password) {
    const errores = [];

    if (!password || password.length < 8) {
        errores.push('La contraseña debe tener al menos 8 caracteres');
    }

    if (!/[A-Z]/.test(password)) {
        errores.push('La contraseña debe contener al menos una mayúscula');
    }

    if (!/[a-z]/.test(password)) {
        errores.push('La contraseña debe contener al menos una minúscula');
    }

    if (!/[0-9]/.test(password)) {
        errores.push('La contraseña debe contener al menos un número');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errores.push('La contraseña debe contener al menos un carácter especial');
    }

    return {
        valido: errores.length === 0,
        errores
    };
}

/**
 * Validar RUT chileno
 * @param {string} rut - RUT en formato 12345678-9
 * @returns {boolean}
 */
export function validarRut(rut) {
    if (!rut || typeof rut !== 'string') return false;

    // Limpiar RUT
    const rutLimpio = rut.replace(/[.-]/g, '');

    if (rutLimpio.length < 2) return false;

    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toUpperCase();

    // Calcular dígito verificador
    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const dvCalculado = 11 - (suma % 11);
    let dvEsperado;

    if (dvCalculado === 11) {
        dvEsperado = '0';
    } else if (dvCalculado === 10) {
        dvEsperado = 'K';
    } else {
        dvEsperado = dvCalculado.toString();
    }

    return dv === dvEsperado;
}

/**
 * Validar teléfono chileno
 * @param {string} telefono
 * @returns {boolean}
 */
export function validarTelefono(telefono) {
    if (!telefono) return false;

    // Formato: +56912345678 o 912345678
    const regex = /^(\+?56)?9\d{8}$/;
    const telefonoLimpio = telefono.replace(/[\s-]/g, '');

    return regex.test(telefonoLimpio);
}

/**
 * Validar nombre (solo letras y espacios)
 * @param {string} nombre
 * @returns {boolean}
 */
export function validarNombre(nombre) {
    if (!nombre || nombre.trim().length < 2) return false;

    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    return regex.test(nombre);
}

/**
 * Sanitizar string (remover caracteres peligrosos)
 * @param {string} str
 * @returns {string}
 */
export function sanitizarString(str) {
    if (!str) return '';

    return str
        .trim()
        .replace(/[<>]/g, '') // Remover < y >
        .replace(/['"]/g, '') // Remover comillas
        .slice(0, 500); // Limitar longitud
}

/**
 * Validar que un valor sea un número positivo
 * @param {any} valor
 * @returns {boolean}
 */
export function esNumeroPositivo(valor) {
    const num = parseFloat(valor);
    return !isNaN(num) && num > 0;
}

/**
 * Validar UUID
 * @param {string} uuid
 * @returns {boolean}
 */
export function validarUUID(uuid) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
}

/**
 * Validar datos de registro
 * @param {Object} data - {email, password, nombre, apellido, rut, telefono?, direccion?, ingresos_mensuales?}
 * @returns {Object} {valido: boolean, errores: Object}
 */
export function validarDatosRegistro(data) {
    const errores = {};

    // Email
    if (!data.email) {
        errores.email = 'El email es requerido';
    } else if (!validarEmail(data.email)) {
        errores.email = 'El email no es válido';
    }

    // Password
    const passwordValidation = validarPassword(data.password);
    if (!passwordValidation.valido) {
        errores.password = passwordValidation.errores;
    }

    // Nombre
    if (!data.nombre) {
        errores.nombre = 'El nombre es requerido';
    } else if (!validarNombre(data.nombre)) {
        errores.nombre = 'El nombre solo puede contener letras y espacios';
    }

    // Apellido
    if (!data.apellido) {
        errores.apellido = 'El apellido es requerido';
    } else if (!validarNombre(data.apellido)) {
        errores.apellido = 'El apellido solo puede contener letras y espacios';
    }

    // RUT
    if (!data.rut) {
        errores.rut = 'El RUT es requerido';
    } else if (!validarRut(data.rut)) {
        errores.rut = 'El RUT no es válido';
    }

    // Teléfono (opcional)
    if (data.telefono && !validarTelefono(data.telefono)) {
        errores.telefono = 'El teléfono no es válido';
    }

    return {
        valido: Object.keys(errores).length === 0,
        errores
    };
}

/**
 * Validar datos de solicitud de crédito
 * @param {Object} data - {monto, tasaInteres, plazoMeses, tipo}
 * @returns {Object} {valido: boolean, errores: Object}
 */
export function validarSolicitudCredito(data) {
    const errores = {};

    // Monto
    if (!data.monto) {
        errores.monto = 'El monto es requerido';
    } else if (!esNumeroPositivo(data.monto)) {
        errores.monto = 'El monto debe ser un número positivo';
    } else if (data.monto < 100000) {
        errores.monto = 'El monto mínimo es $100,000';
    } else if (data.monto > 100000000) {
        errores.monto = 'El monto máximo es $100,000,000';
    }

    // Tasa de interés
    if (data.tasaInteres === undefined || data.tasaInteres === null) {
        errores.tasaInteres = 'La tasa de interés es requerida';
    } else if (data.tasaInteres < 0 || data.tasaInteres > 50) {
        errores.tasaInteres = 'La tasa de interés debe estar entre 0% y 50%';
    }

    // Plazo
    if (!data.plazoMeses) {
        errores.plazoMeses = 'El plazo es requerido';
    } else if (!Number.isInteger(data.plazoMeses) || data.plazoMeses < 1) {
        errores.plazoMeses = 'El plazo debe ser un número entero positivo';
    } else if (data.plazoMeses < 3) {
        errores.plazoMeses = 'El plazo mínimo es 3 meses';
    } else if (data.plazoMeses > 360) {
        errores.plazoMeses = 'El plazo máximo es 360 meses (30 años)';
    }

    // Tipo
    const tiposValidos = ['CONSUMO', 'HIPOTECARIO', 'AUTOMOTRIZ', 'EMPRESARIAL'];
    if (!data.tipo) {
        errores.tipo = 'El tipo de crédito es requerido';
    } else if (!tiposValidos.includes(data.tipo.toUpperCase())) {
        errores.tipo = `El tipo debe ser uno de: ${tiposValidos.join(', ')}`;
    }

    return {
        valido: Object.keys(errores).length === 0,
        errores
    };
}

/**
 * Formatear RUT (xx.xxx.xxx-x)
 * @param {string} rut
 * @returns {string}
 */
export function formatearRut(rut) {
    if (!rut) return rut;
    const rutLimpio = rut.replace(/[^0-9kK]/g, '');
    if (rutLimpio.length < 2) return rut;

    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toUpperCase();

    // Formatear cuerpo con puntos
    const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return `${cuerpoFormateado}-${dv}`;
}

export default {
    validarEmail,
    validarPassword,
    validarRut,
    validarTelefono,
    validarNombre,
    sanitizarString,
    validarUUID,
    validarDatosRegistro,
    validarSolicitudCredito,
    formatearRut
};
