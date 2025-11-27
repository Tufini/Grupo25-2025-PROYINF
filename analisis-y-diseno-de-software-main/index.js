/**
 * UsmBank (Aurora Privé) - Main Server
 * Sistema Bancario con API REST
 * @version 1.0.0
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import configurations
import { testConnection } from './src/config/database.js';

// Import routes
import apiRoutes from './src/routes/index.js';

// Import middleware
import {
    errorHandler,
    notFoundHandler,
    requestLogger,
    validateJsonContent,
    validateBodySize
} from './src/middleware/error.middleware.js';

// ============================================================================
// SETUP
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// MIDDLEWARE GLOBAL
// ============================================================================

// CORS - permitir peticiones desde el frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Validar JSON content type para POST/PUT/PATCH
app.use(validateJsonContent);

// Validar tamaño del body (100KB max)
app.use(validateBodySize(100));

// ============================================================================
// STATIC FILES (Frontend)
// ============================================================================

app.use(express.static(path.join(__dirname, 'public')));

// ============================================================================
// FRONTEND ROUTES
// ============================================================================

app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/simulador', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'simulador.html'));
});

app.get('/dashboard', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/api', apiRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 - Ruta no encontrada
app.use(notFoundHandler);

// Error handler centralizado
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer() {
    try {
        console.log('🚀 Iniciando UsmBank API Server...\n');

        // Test database connection
        console.log('📊 Probando conexión a base de datos...');
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error('❌ No se pudo conectar a la base de datos');
            console.error('⚠️  El servidor continuará, pero las operaciones de BD fallarán');
        }

        // Start server
        app.listen(PORT, () => {
            console.log('\n✅ Servidor iniciado exitosamente\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`🌐 Servidor:        http://localhost:${PORT}`);
            console.log(`🔌 API:             http://localhost:${PORT}/api`);
            console.log(`💚 Health Check:    http://localhost:${PORT}/api/health`);
            console.log(`📄 Frontend:        http://localhost:${PORT}`);
            console.log(`🧮 Simulador:       http://localhost:${PORT}/simulador`);
            console.log(`📊 Dashboard:       http://localhost:${PORT}/dashboard`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('📋 Endpoints disponibles:');
            console.log('  Auth:');
            console.log('    POST   /api/auth/register');
            console.log('    POST   /api/auth/login');
            console.log('    GET    /api/auth/profile');
            console.log('  Simulaciones:');
            console.log('    POST   /api/simulaciones');
            console.log('    GET    /api/simulaciones');
            console.log('  Créditos:');
            console.log('    POST   /api/creditos');
            console.log('    GET    /api/creditos');
            console.log('    GET    /api/creditos/:id');
            console.log('    GET    /api/creditos/estadisticas');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('🎯 Presiona Ctrl+C para detener el servidor\n');
        });
    } catch (error) {
        console.error('❌ Error fatal al iniciar el servidor:', error);
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    // En producción, cerrar el servidor
    // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n👋 SIGTERM recibido. Cerrando servidor gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n👋 SIGINT recibido. Cerrando servidor gracefully...');
    process.exit(0);
});

// ============================================================================
// START
// ============================================================================

startServer();
