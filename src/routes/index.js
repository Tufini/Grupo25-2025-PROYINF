/**
 * Routes Index
 * Punto central para todas las rutas de la API
 */

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import creditoRoutes from './credito.routes.js';
import cmfRoutes from './cmf.routes.js';
import bcentralRoutes from './bcentral.routes.js';

const router = Router();



/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'UsmBank API',
        version: '1.0.0'
    });
});

/**
 * API Info endpoint
 */
router.get('/', (req, res) => {
    res.status(200).json({
        service: 'UsmBank (Aurora Privé) API',
        version: '1.0.0',
        description: 'API RESTful para sistema bancario',
        endpoints: {
            health: 'GET /api/health',
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                profile: 'GET /api/auth/profile',
                changePassword: 'PUT /api/auth/change-password',
                verifyToken: 'POST /api/auth/verify-token'
            },
            simulaciones: {
                simular: 'POST /api/simulaciones',
                historial: 'GET /api/simulaciones'
            },
            creditos: {
                solicitar: 'POST /api/creditos',
                listar: 'GET /api/creditos',
                detalle: 'GET /api/creditos/:id',
                estadisticas: 'GET /api/creditos/estadisticas',
                aprobar: 'POST /api/creditos/:id/aprobar',
                desembolsar: 'POST /api/creditos/:id/desembolsar',
                rechazar: 'POST /api/creditos/:id/rechazar'
            }
        },
        documentation: 'https://github.com/usmbank/api-docs'
    });
});

// Montar rutas
router.use('/auth', authRoutes);
router.use('/cmf', cmfRoutes);
router.use('/bcentral', bcentralRoutes);
router.use('/', creditoRoutes); // Las rutas de crédito ya tienen /creditos y /simulaciones

export default router;
