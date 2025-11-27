-- ============================================================================
-- USMBANK (AURORA PRIVÉ) - DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0.0
-- Date: 2025-11-24
-- Description: Complete banking application database schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMERATIONS (TYPES)
-- ============================================================================

-- Tipo de cliente
CREATE TYPE tipo_cliente AS ENUM ('REGULAR', 'PREMIUM', 'VIP');

-- Estado de crédito
CREATE TYPE estado_credito AS ENUM (
    'PENDIENTE',
    'EVALUACION',
    'APROBADO',
    'RECHAZADO',
    'DESEMBOLSADO',
    'CANCELADO'
);

-- Tipo de crédito
CREATE TYPE tipo_credito AS ENUM (
    'CONSUMO',
    'HIPOTECARIO',
    'AUTOMOTRIZ',
    'EMPRESARIAL'
);

-- Estado de cuota
CREATE TYPE estado_cuota AS ENUM (
    'PENDIENTE',
    'PAGADA',
    'MORA',
    'VENCIDA'
);

-- Tipo de cuenta bancaria
CREATE TYPE tipo_cuenta AS ENUM (
    'CORRIENTE',
    'VISTA',
    'AHORRO'
);

-- Tipo de transacción
CREATE TYPE tipo_transaccion AS ENUM (
    'DEPOSITO',
    'RETIRO',
    'TRANSFERENCIA',
    'PAGO_CUOTA'
);

-- ============================================================================
-- TABLE: usuarios
-- ============================================================================
-- Almacena información de autenticación y datos básicos del usuario
-- ============================================================================

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT true,
    intentos_login INTEGER NOT NULL DEFAULT 0,
    bloqueado_hasta TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- ============================================================================
-- TABLE: clientes
-- ============================================================================
-- Información financiera y de perfil del cliente bancario
-- ============================================================================

CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    rut VARCHAR(12) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    ingresos_mensuales DECIMAL(15, 2),
    score_credito INTEGER CHECK (score_credito >= 300 AND score_credito <= 850),
    fecha_afiliacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo tipo_cliente NOT NULL DEFAULT 'REGULAR',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para clientes
CREATE INDEX idx_clientes_usuario_id ON clientes(usuario_id);
CREATE INDEX idx_clientes_rut ON clientes(rut);
CREATE INDEX idx_clientes_tipo ON clientes(tipo);
CREATE INDEX idx_clientes_score ON clientes(score_credito);

-- ============================================================================
-- TABLE: creditos
-- ============================================================================
-- Solicitudes y gestión de créditos bancarios
-- ============================================================================

CREATE TABLE creditos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    simulacion_id UUID REFERENCES simulaciones(id),
    monto_solicitado DECIMAL(15, 2) NOT NULL CHECK (monto_solicitado > 0),
    monto_aprobado DECIMAL(15, 2) CHECK (monto_aprobado > 0),
    tasa_interes DECIMAL(5, 2) NOT NULL CHECK (tasa_interes >= 0),
    plazo_meses INTEGER NOT NULL CHECK (plazo_meses > 0),
    cuota_mensual DECIMAL(15, 2),
    total_pagar DECIMAL(15, 2),
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion TIMESTAMP,
    fecha_desembolso TIMESTAMP,
    estado estado_credito NOT NULL DEFAULT 'PENDIENTE',
    tipo tipo_credito NOT NULL,
    notas TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para créditos
CREATE INDEX idx_creditos_cliente_id ON creditos(cliente_id);
CREATE INDEX idx_creditos_estado ON creditos(estado);
CREATE INDEX idx_creditos_tipo ON creditos(tipo);
CREATE INDEX idx_creditos_fecha_solicitud ON creditos(fecha_solicitud);

-- ============================================================================
-- TABLE: simulaciones
-- ============================================================================
-- Historial de simulaciones de crédito realizadas por los clientes
-- ============================================================================

CREATE TABLE simulaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    monto DECIMAL(15, 2) NOT NULL CHECK (monto > 0),
    tasa_interes DECIMAL(5, 2) NOT NULL CHECK (tasa_interes >= 0),
    plazo_meses INTEGER NOT NULL CHECK (plazo_meses > 0),
    cuota_mensual DECIMAL(15, 2) NOT NULL,
    total_pagar DECIMAL(15, 2) NOT NULL,
    fecha_simulacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    convertido_a_solicitud BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para simulaciones
CREATE INDEX idx_simulaciones_cliente_id ON simulaciones(cliente_id);
CREATE INDEX idx_simulaciones_fecha ON simulaciones(fecha_simulacion);
CREATE INDEX idx_simulaciones_convertido ON simulaciones(convertido_a_solicitud);

-- ============================================================================
-- TABLE: cuotas
-- ============================================================================
-- Tabla de amortización y seguimiento de pagos de cuotas
-- ============================================================================

CREATE TABLE cuotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credito_id UUID NOT NULL REFERENCES creditos(id) ON DELETE CASCADE,
    numero_cuota INTEGER NOT NULL CHECK (numero_cuota > 0),
    monto_cuota DECIMAL(15, 2) NOT NULL CHECK (monto_cuota > 0),
    capital DECIMAL(15, 2) NOT NULL CHECK (capital >= 0),
    interes DECIMAL(15, 2) NOT NULL CHECK (interes >= 0),
    saldo_pendiente DECIMAL(15, 2) NOT NULL CHECK (saldo_pendiente >= 0),
    fecha_vencimiento DATE NOT NULL,
    fecha_pago TIMESTAMP,
    estado estado_cuota NOT NULL DEFAULT 'PENDIENTE',
    dias_mora INTEGER DEFAULT 0,
    monto_mora DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(credito_id, numero_cuota)
);

-- Índices para cuotas
CREATE INDEX idx_cuotas_credito_id ON cuotas(credito_id);
CREATE INDEX idx_cuotas_estado ON cuotas(estado);
CREATE INDEX idx_cuotas_fecha_vencimiento ON cuotas(fecha_vencimiento);
CREATE INDEX idx_cuotas_fecha_pago ON cuotas(fecha_pago);

-- ============================================================================
-- TABLE: cuentas_bancarias
-- ============================================================================
-- Cuentas bancarias asociadas a clientes
-- ============================================================================

CREATE TABLE cuentas_bancarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    numero_cuenta VARCHAR(20) UNIQUE NOT NULL,
    tipo tipo_cuenta NOT NULL,
    saldo DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (saldo >= 0),
    moneda VARCHAR(3) NOT NULL DEFAULT 'CLP',
    activa BOOLEAN NOT NULL DEFAULT true,
    fecha_apertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para cuentas bancarias
CREATE INDEX idx_cuentas_cliente_id ON cuentas_bancarias(cliente_id);
CREATE INDEX idx_cuentas_numero ON cuentas_bancarias(numero_cuenta);
CREATE INDEX idx_cuentas_activa ON cuentas_bancarias(activa);

-- ============================================================================
-- TABLE: transacciones
-- ============================================================================
-- Registro de todas las transacciones bancarias
-- ============================================================================

CREATE TABLE transacciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cuenta_origen_id UUID REFERENCES cuentas_bancarias(id),
    cuenta_destino_id UUID REFERENCES cuentas_bancarias(id),
    cuota_id UUID REFERENCES cuotas(id),
    tipo tipo_transaccion NOT NULL,
    monto DECIMAL(15, 2) NOT NULL CHECK (monto > 0),
    descripcion TEXT,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    referencia VARCHAR(50),
    estado VARCHAR(20) NOT NULL DEFAULT 'COMPLETADA',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para transacciones
CREATE INDEX idx_transacciones_cuenta_origen ON transacciones(cuenta_origen_id);
CREATE INDEX idx_transacciones_cuenta_destino ON transacciones(cuenta_destino_id);
CREATE INDEX idx_transacciones_cuota ON transacciones(cuota_id);
CREATE INDEX idx_transacciones_fecha ON transacciones(fecha);
CREATE INDEX idx_transacciones_tipo ON transacciones(tipo);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creditos_updated_at BEFORE UPDATE ON creditos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cuotas_updated_at BEFORE UPDATE ON cuotas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cuentas_updated_at BEFORE UPDATE ON cuentas_bancarias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Vista para obtener información completa del cliente
CREATE OR REPLACE VIEW vista_clientes_completa AS
SELECT
    c.id,
    c.rut,
    u.email,
    u.nombre,
    u.apellido,
    c.telefono,
    c.tipo,
    c.score_credito,
    c.ingresos_mensuales,
    u.activo,
    c.fecha_afiliacion
FROM clientes c
INNER JOIN usuarios u ON c.usuario_id = u.id;

-- Vista para dashboard de créditos activos
CREATE OR REPLACE VIEW vista_creditos_activos AS
SELECT
    cr.id,
    c.rut,
    u.nombre || ' ' || u.apellido AS nombre_completo,
    cr.tipo,
    cr.monto_aprobado,
    cr.tasa_interes,
    cr.plazo_meses,
    cr.cuota_mensual,
    cr.estado,
    cr.fecha_solicitud,
    cr.fecha_desembolso,
    COUNT(cu.id) AS total_cuotas,
    COUNT(cu.id) FILTER (WHERE cu.estado = 'PAGADA') AS cuotas_pagadas,
    COUNT(cu.id) FILTER (WHERE cu.estado = 'MORA') AS cuotas_mora
FROM creditos cr
INNER JOIN clientes c ON cr.cliente_id = c.id
INNER JOIN usuarios u ON c.usuario_id = u.id
LEFT JOIN cuotas cu ON cr.id = cu.credito_id
WHERE cr.estado IN ('APROBADO', 'DESEMBOLSADO')
GROUP BY cr.id, c.rut, u.nombre, u.apellido, cr.tipo, cr.monto_aprobado,
         cr.tasa_interes, cr.plazo_meses, cr.cuota_mensual, cr.estado,
         cr.fecha_solicitud, cr.fecha_desembolso;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Función para generar número de cuenta único
CREATE OR REPLACE FUNCTION generar_numero_cuenta()
RETURNS VARCHAR(20) AS $$
DECLARE
    numero VARCHAR(20);
    existe BOOLEAN;
BEGIN
    LOOP
        -- Generar número de cuenta: 2 dígitos + 8 dígitos aleatorios + 1 dígito verificador
        numero := '20' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0') ||
                  FLOOR(RANDOM() * 10)::TEXT;

        -- Verificar si ya existe
        SELECT EXISTS(SELECT 1 FROM cuentas_bancarias WHERE numero_cuenta = numero) INTO existe;

        EXIT WHEN NOT existe;
    END LOOP;

    RETURN numero;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE usuarios IS 'Usuarios del sistema con credenciales de autenticación';
COMMENT ON TABLE clientes IS 'Información de perfil financiero de clientes';
COMMENT ON TABLE creditos IS 'Solicitudes y gestión de créditos bancarios';
COMMENT ON TABLE simulaciones IS 'Historial de simulaciones de crédito';
COMMENT ON TABLE cuotas IS 'Tabla de amortización y seguimiento de pagos';
COMMENT ON TABLE cuentas_bancarias IS 'Cuentas bancarias de clientes';
COMMENT ON TABLE transacciones IS 'Registro de transacciones bancarias';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT
    schemaname,
    tablename
FROM pg_catalog.pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY tablename;

COMMENT ON SCHEMA public IS 'UsmBank (Aurora Privé) - Sistema Bancario v1.0.0';
