-- ============================================================================
-- SCHEMA INICIAL PARA AURORA PRIVÉ
-- Sistema de Gestión de Créditos y Usuarios
-- ============================================================================

-- Eliminar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS creditos CASCADE;
DROP TABLE IF EXISTS simulaciones CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- ============================================================================
-- TABLA: usuarios
-- ============================================================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    intentos_login INTEGER DEFAULT 0,
    bloqueado_hasta TIMESTAMP,
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- ============================================================================
-- TABLA: clientes
-- ============================================================================
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    rut VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    ciudad VARCHAR(100),
    region VARCHAR(100),
    ingresos_mensuales DECIMAL(12, 2) NOT NULL DEFAULT 0,
    score_credito INTEGER DEFAULT 0,
    tipo VARCHAR(20) DEFAULT 'REGULAR' CHECK (tipo IN ('REGULAR', 'PREMIUM', 'VIP')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT rut_format CHECK (rut ~* '^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$'),
    CONSTRAINT score_range CHECK (score_credito BETWEEN 0 AND 1000),
    CONSTRAINT ingresos_positive CHECK (ingresos_mensuales >= 0)
);

CREATE INDEX idx_clientes_usuario_id ON clientes(usuario_id);
CREATE INDEX idx_clientes_rut ON clientes(rut);
CREATE INDEX idx_clientes_score ON clientes(score_credito);
CREATE INDEX idx_clientes_tipo ON clientes(tipo);

-- ============================================================================
-- TABLA: simulaciones
-- ============================================================================
CREATE TABLE simulaciones (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    monto DECIMAL(12, 2) NOT NULL,
    plazo_meses INTEGER NOT NULL,
    tasa_interes DECIMAL(5, 4) NOT NULL,
    cuota_mensual DECIMAL(12, 2) NOT NULL,
    tipo_credito VARCHAR(50) DEFAULT 'CONSUMO',
    fecha_simulacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    
    CONSTRAINT monto_positive CHECK (monto > 0),
    CONSTRAINT plazo_valid CHECK (plazo_meses BETWEEN 1 AND 60),
    CONSTRAINT tasa_valid CHECK (tasa_interes >= 0 AND tasa_interes <= 1)
);

CREATE INDEX idx_simulaciones_cliente_id ON simulaciones(cliente_id);
CREATE INDEX idx_simulaciones_fecha ON simulaciones(fecha_simulacion DESC);

-- ============================================================================
-- TABLA: creditos
-- ============================================================================
CREATE TABLE creditos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    tipo_credito VARCHAR(50) NOT NULL DEFAULT 'CONSUMO',
    monto_solicitado DECIMAL(12, 2) NOT NULL,
    monto_aprobado DECIMAL(12, 2),
    plazo_meses INTEGER NOT NULL,
    tasa_interes DECIMAL(5, 4) NOT NULL,
    cuota_mensual DECIMAL(12, 2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_REVISION', 'APROBADO', 'RECHAZADO', 'DESEMBOLSADO', 'CANCELADO')),
    score_credito INTEGER,
    notas TEXT,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion TIMESTAMP,
    fecha_desembolso TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT monto_solicitado_positive CHECK (monto_solicitado > 0),
    CONSTRAINT plazo_valid CHECK (plazo_meses BETWEEN 1 AND 60),
    CONSTRAINT tasa_valid CHECK (tasa_interes >= 0 AND tasa_interes <= 1)
);

CREATE INDEX idx_creditos_cliente_id ON creditos(cliente_id);
CREATE INDEX idx_creditos_estado ON creditos(estado);
CREATE INDEX idx_creditos_fecha_solicitud ON creditos(fecha_solicitud DESC);

-- ============================================================================
-- TRIGGER: Actualizar fecha_actualizacion automáticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clientes_fecha_actualizacion
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

CREATE TRIGGER trigger_creditos_fecha_actualizacion
    BEFORE UPDATE ON creditos
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

-- ============================================================================
-- DATOS DE PRUEBA (Opcional - comentar en producción)
-- ============================================================================

-- Usuario de prueba
INSERT INTO usuarios (email, password_hash, nombre, apellido) VALUES
('test@aurora.cl', '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', 'Juan', 'Pérez'),
('admin@aurora.cl', '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', 'Admin', 'Sistema');

-- Cliente asociado al usuario de prueba
INSERT INTO clientes (usuario_id, rut, telefono, ingresos_mensuales, score_credito, tipo) VALUES
(1, '12.345.678-9', '+56912345678', 1500000, 850, 'VIP'),
(2, '98.765.432-1', '+56987654321', 2500000, 920, 'PREMIUM');

-- Simulación de ejemplo
INSERT INTO simulaciones (cliente_id, monto, plazo_meses, tasa_interes, cuota_mensual, tipo_credito) VALUES
(1, 5000000, 36, 0.011, 165000, 'CONSUMO');

-- Crédito de ejemplo
INSERT INTO creditos (cliente_id, tipo_credito, monto_solicitado, monto_aprobado, plazo_meses, tasa_interes, cuota_mensual, estado, score_credito) VALUES
(1, 'CONSUMO', 5000000, 5000000, 36, 0.011, 165000, 'APROBADO', 850);

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista de usuarios con información de cliente
CREATE OR REPLACE VIEW vista_usuarios_completos AS
SELECT 
    u.id as usuario_id,
    u.email,
    u.nombre,
    u.apellido,
    u.fecha_registro,
    u.ultimo_acceso,
    u.activo,
    c.id as cliente_id,
    c.rut,
    c.telefono,
    c.ingresos_mensuales,
    c.score_credito,
    c.tipo as tipo_cliente
FROM usuarios u
LEFT JOIN clientes c ON u.id = c.usuario_id;

-- Vista de créditos con información del cliente
CREATE OR REPLACE VIEW vista_creditos_completos AS
SELECT 
    cr.id as credito_id,
    cr.tipo_credito,
    cr.monto_solicitado,
    cr.monto_aprobado,
    cr.plazo_meses,
    cr.tasa_interes,
    cr.cuota_mensual,
    cr.estado,
    cr.fecha_solicitud,
    c.rut,
    u.nombre,
    u.apellido,
    u.email,
    c.score_credito
FROM creditos cr
LEFT JOIN clientes c ON cr.cliente_id = c.id
LEFT JOIN usuarios u ON c.usuario_id = u.id;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE usuarios IS 'Usuarios del sistema con credenciales de acceso';
COMMENT ON TABLE clientes IS 'Información financiera y personal de los clientes';
COMMENT ON TABLE simulaciones IS 'Simulaciones de crédito realizadas por los usuarios';
COMMENT ON TABLE creditos IS 'Solicitudes de crédito formales con estado de aprobación';

COMMENT ON COLUMN usuarios.password_hash IS 'Hash bcrypt de la contraseña';
COMMENT ON COLUMN usuarios.intentos_login IS 'Contador de intentos fallidos de login';
COMMENT ON COLUMN usuarios.bloqueado_hasta IS 'Fecha hasta la cual el usuario está bloqueado';

COMMENT ON COLUMN clientes.score_credito IS 'Puntuación crediticia de 0 a 1000';
COMMENT ON COLUMN clientes.tipo IS 'Tipo de cliente: REGULAR, PREMIUM o VIP';

COMMENT ON COLUMN creditos.notas IS 'Campo JSON con datos adicionales del scoring y wizard';

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- Mostrar resumen
SELECT 'Schema creado exitosamente' as mensaje;
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
