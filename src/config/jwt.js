/**
 * JWT Configuration
 * Configuración de JSON Web Tokens
 */

export const jwtConfig = {
    secret: process.env.JWT_SECRET || 'usmbank-aurora-prive-secret-key-2024-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'UsmBank Aurora Privé',
    audience: 'usmbank-clients'
};

export default jwtConfig;
