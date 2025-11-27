/**
 * Database Migration Script
 * Ejecuta migraciones y seeds de la base de datos
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de la base de datos
const pool = new Pool({
    host: process.env.DB_HOST || 'postgres_db',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'mydb'
});

async function runMigrations() {
    console.log('🚀 Iniciando migraciones de base de datos...\n');

    try {
        // Test connection
        console.log('📊 Conectando a PostgreSQL...');
        await pool.query('SELECT NOW()');
        console.log('✅ Conexión exitosa\n');

        // Read migration file
        const migrationPath = path.join(__dirname, '..', 'migrations', '001_create_schema.sql');
        console.log(`📄 Leyendo migración: ${migrationPath}`);

        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute migration
        console.log('⚙️  Ejecutando migración...');
        await pool.query(migrationSQL);
        console.log('✅ Migración ejecutada exitosamente\n');

        // Show created tables
        const result = await pool.query(`
            SELECT tablename
            FROM pg_catalog.pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename;
        `);

        console.log('📋 Tablas creadas:');
        result.rows.forEach(row => {
            console.log(`   - ${row.tablename}`);
        });

        console.log('\n✅ Migraciones completadas exitosamente\n');
        return true;
    } catch (error) {
        console.error('❌ Error al ejecutar migraciones:', error.message);
        if (error.detail) console.error('Detalle:', error.detail);
        if (error.hint) console.error('Sugerencia:', error.hint);
        return false;
    }
}

async function runSeeds() {
    console.log('🌱 Iniciando seeds de datos de prueba...\n');

    try {
        // Read seed file
        const seedPath = path.join(__dirname, '..', 'seeds', '001_seed_data.sql');
        console.log(`📄 Leyendo seeds: ${seedPath}`);

        const seedSQL = fs.readFileSync(seedPath, 'utf8');

        // Hash passwords for seed data
        const bcrypt = await import('bcrypt');

        const password1 = await bcrypt.hash('Password123!', 10);
        const password2 = await bcrypt.hash('Premium2024!', 10);
        const password3 = await bcrypt.hash('VIP2024Secure!', 10);

        // Replace placeholders with real hashed passwords
        const seedSQLWithPasswords = seedSQL
            .replace('$2b$10$YourHashedPasswordHere1', password1)
            .replace('$2b$10$YourHashedPasswordHere2', password2)
            .replace('$2b$10$YourHashedPasswordHere3', password3);

        // Execute seeds
        console.log('⚙️  Ejecutando seeds...');
        await pool.query(seedSQLWithPasswords);
        console.log('✅ Seeds ejecutados exitosamente\n');

        // Show inserted data
        const result = await pool.query(`
            SELECT 'usuarios' AS tabla, COUNT(*) AS registros FROM usuarios
            UNION ALL
            SELECT 'clientes', COUNT(*) FROM clientes
            UNION ALL
            SELECT 'cuentas_bancarias', COUNT(*) FROM cuentas_bancarias
            UNION ALL
            SELECT 'creditos', COUNT(*) FROM creditos
            UNION ALL
            SELECT 'cuotas', COUNT(*) FROM cuotas
            UNION ALL
            SELECT 'simulaciones', COUNT(*) FROM simulaciones
            UNION ALL
            SELECT 'transacciones', COUNT(*) FROM transacciones
            ORDER BY tabla;
        `);

        console.log('📊 Datos insertados:');
        result.rows.forEach(row => {
            console.log(`   ${row.tabla}: ${row.registros} registros`);
        });

        console.log('\n✅ Seeds completados exitosamente\n');
        console.log('👤 Usuarios de prueba creados:');
        console.log('   1. Email: juan.perez@email.com');
        console.log('      Password: Password123!');
        console.log('      Tipo: REGULAR\n');
        console.log('   2. Email: maria.gonzalez@email.com');
        console.log('      Password: Premium2024!');
        console.log('      Tipo: PREMIUM\n');
        console.log('   3. Email: carlos.silva@email.com');
        console.log('      Password: VIP2024Secure!');
        console.log('      Tipo: VIP\n');

        return true;
    } catch (error) {
        console.error('❌ Error al ejecutar seeds:', error.message);
        if (error.detail) console.error('Detalle:', error.detail);
        if (error.hint) console.error('Sugerencia:', error.hint);
        return false;
    }
}

async function main() {
    const args = process.argv.slice(2);
    const skipSeeds = args.includes('--no-seeds');

    try {
        // Run migrations
        const migrationSuccess = await runMigrations();

        if (!migrationSuccess) {
            console.error('\n❌ Migraciones fallidas. Abortando...');
            process.exit(1);
        }

        // Run seeds (unless --no-seeds flag)
        if (!skipSeeds) {
            const seedSuccess = await runSeeds();

            if (!seedSuccess) {
                console.error('\n⚠️  Seeds fallidos. La base de datos está creada pero sin datos de prueba.');
            }
        } else {
            console.log('⏭️  Seeds omitidos (--no-seeds flag)\n');
        }

        console.log('🎉 Proceso completado exitosamente!\n');
    } catch (error) {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('👋 Conexión cerrada\n');
    }
}

main();
