/**
 * Error Handling Middleware
 * Middleware centralizado para manejo de errores
 */

/**
 * Middleware para manejar errores de forma centralizada
 */
export function errorHandler(err, req, res, next) {
    console.error('❌ Error capturado:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    // Error personalizado con status
    if (err.status) {
        return res.status(err.status).json({
            error: err.message,
            ...(err.errores && { errores: err.errores }),
            ...(err.detalles && { detalles: err.detalles })
        });
    }

    // Error de validación de PostgreSQL
    if (err.code) {
        switch (err.code) {
            case '23505': // Unique violation
                return res.status(409).json({
                    error: 'El registro ya existe',
                    message: 'Ya existe un registro con estos datos',
                    detalle: err.detail
                });

            case '23503': // Foreign key violation
                return res.status(400).json({
                    error: 'Referencia inválida',
                    message: 'El registro referenciado no existe',
                    detalle: err.detail
                });

            case '23502': // Not null violation
                return res.status(400).json({
                    error: 'Campo requerido faltante',
                    message: 'Todos los campos requeridos deben ser proporcionados',
                    campo: err.column
                });

            case '22P02': // Invalid text representation
                return res.status(400).json({
                    error: 'Formato de dato inválido',
                    message: 'Uno o más campos tienen formato inválido'
                });

            default:
                console.error('Error de base de datos no manejado:', err.code, err.message);
        }
    }

    // Error de sintaxis JSON
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: 'JSON inválido',
            message: 'El cuerpo de la solicitud contiene JSON mal formado'
        });
    }

    // Error genérico
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'production'
            ? 'Ha ocurrido un error. Por favor intente nuevamente'
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
}

/**
 * Middleware para manejar rutas no encontradas (404)
 */
export function notFoundHandler(req, res) {
    res.status(404).json({
        error: 'Ruta no encontrada',
        message: `La ruta ${req.method} ${req.originalUrl} no existe`,
        disponibles: {
            auth: '/api/auth/login, /api/auth/register',
            creditos: '/api/creditos',
            simulaciones: '/api/simulaciones',
            perfil: '/api/perfil'
        }
    });
}

/**
 * Wrapper para async route handlers
 * Captura errores de funciones async y los pasa al errorHandler
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Middleware para logging de requests
 */
export function requestLogger(req, res, next) {
    const start = Date.now();

    // Log cuando la respuesta termina
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            timestamp: new Date().toISOString()
        };

        // Color según status code
        const statusColor = res.statusCode >= 500 ? '🔴'
            : res.statusCode >= 400 ? '🟠'
            : res.statusCode >= 300 ? '🟡'
            : '🟢';

        console.log(`${statusColor} ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });

    next();
}

/**
 * Middleware para validar Content-Type JSON
 */
export function validateJsonContent(req, res, next) {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.get('content-type');

        if (!contentType || !contentType.includes('application/json')) {
            return res.status(400).json({
                error: 'Content-Type inválido',
                message: 'El Content-Type debe ser application/json',
                recibido: contentType || 'ninguno'
            });
        }
    }

    next();
}

/**
 * Middleware para limitar tamaño del body
 */
export function validateBodySize(maxSizeKB = 100) {
    return (req, res, next) => {
        const contentLength = req.get('content-length');

        if (contentLength && parseInt(contentLength) > maxSizeKB * 1024) {
            return res.status(413).json({
                error: 'Cuerpo de solicitud demasiado grande',
                message: `El tamaño máximo permitido es ${maxSizeKB}KB`,
                recibido: `${Math.round(parseInt(contentLength) / 1024)}KB`
            });
        }

        next();
    };
}

export default {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    requestLogger,
    validateJsonContent,
    validateBodySize
};
