/**
 * Database Configuration
 * Configuración de conexión a PostgreSQL
 */

import pg from 'pg';
const { Pool } = pg;

// Configuración del pool de conexiones
const pool = new Pool({
    host: process.env.DB_HOST || 'postgres_db',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'mydb',
    max: 20, // Máximo número de clientes en el pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Event listeners para debugging
pool.on('connect', () => {
    console.log('✅ Nueva conexión establecida con PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Error inesperado en el pool de conexiones:', err);
    process.exit(-1);
});

/**
 * Query helper function
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
export const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Query ejecutada', { text, duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('❌ Error en query:', { text, error: error.message });
        throw error;
    }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise} Pool client
 */
export const getClient = async () => {
    const client = await pool.connect();
    const query = client.query;
    const release = client.release;

    // Set timeout for transaction
    const timeout = setTimeout(() => {
        console.error('❌ Cliente no liberado después de 5 segundos');
    }, 5000);

    // Override release to clear timeout
    client.release = () => {
        clearTimeout(timeout);
        client.query = query;
        client.release = release;
        return release.apply(client);
    };

    return client;
};

/**
 * Test database connection
 * @returns {Promise<boolean>}
 */
export const testConnection = async () => {
    try {
        const result = await query('SELECT NOW() as now, version() as version');
        console.log('✅ Conexión a base de datos exitosa');
        console.log('📅 Server time:', result.rows[0].now);
        console.log('🐘 PostgreSQL version:', result.rows[0].version);
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error.message);
        return false;
    }
};

export default pool;
