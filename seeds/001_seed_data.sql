-- ============================================================================
-- USMBANK (AURORA PRIVÉ) - SEED DATA
-- ============================================================================
-- Version: 1.0.0
-- Date: 2025-11-24
-- Description: Datos de prueba para desarrollo y testing
-- ============================================================================

-- ============================================================================
-- USUARIOS Y CLIENTES DE PRUEBA
-- ============================================================================

-- Usuario 1: Cliente Regular
-- Password: Password123!
INSERT INTO usuarios (id, email, password_hash, nombre, apellido, activo)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'juan.perez@email.com',
    '$2b$10$YourHashedPasswordHere1', -- Placeholder, se reemplazará en la app
    'Juan',
    'Pérez',
    true
);

INSERT INTO clientes (id, usuario_id, rut, telefono, direccion, ingresos_mensuales, score_credito, tipo)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '12345678-9',
    '+56912345678',
    'Av. Principal 123, Santiago',
    1500000.00,
    650,
    'REGULAR'
);

-- Usuario 2: Cliente Premium
-- Password: Premium2024!
INSERT INTO usuarios (id, email, password_hash, nombre, apellido, activo)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'maria.gonzalez@email.com',
    '$2b$10$YourHashedPasswordHere2',
    'María',
    'González',
    true
);

INSERT INTO clientes (id, usuario_id, rut, telefono, direccion, ingresos_mensuales, score_credito, tipo)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    '23456789-0',
    '+56923456789',
    'Calle Secundaria 456, Valparaíso',
    3500000.00,
    750,
    'PREMIUM'
);

-- Usuario 3: Cliente VIP
-- Password: VIP2024Secure!
INSERT INTO usuarios (id, email, password_hash, nombre, apellido, activo)
VALUES (
    '55555555-5555-5555-5555-555555555555',
    'carlos.silva@email.com',
    '$2b$10$YourHashedPasswordHere3',
    'Carlos',
    'Silva',
    true
);

INSERT INTO clientes (id, usuario_id, rut, telefono, direccion, ingresos_mensuales, score_credito, tipo)
VALUES (
    '66666666-6666-6666-6666-666666666666',
    '55555555-5555-5555-5555-555555555555',
    '34567890-1',
    '+56934567890',
    'Paseo Marítimo 789, Viña del Mar',
    8000000.00,
    820,
    'VIP'
);

-- ============================================================================
-- CUENTAS BANCARIAS
-- ============================================================================

-- Cuenta corriente para Juan Pérez
INSERT INTO cuentas_bancarias (id, cliente_id, numero_cuenta, tipo, saldo, moneda)
VALUES (
    '77777777-7777-7777-7777-777777777777',
    '22222222-2222-2222-2222-222222222222',
    '20123456789',
    'CORRIENTE',
    500000.00,
    'CLP'
);

-- Cuenta de ahorro para María González
INSERT INTO cuentas_bancarias (id, cliente_id, numero_cuenta, tipo, saldo, moneda)
VALUES (
    '88888888-8888-8888-8888-888888888888',
    '44444444-4444-4444-4444-444444444444',
    '20234567890',
    'AHORRO',
    2500000.00,
    'CLP'
);

-- Cuenta corriente para María González
INSERT INTO cuentas_bancarias (id, cliente_id, numero_cuenta, tipo, saldo, moneda)
VALUES (
    '99999999-9999-9999-9999-999999999999',
    '44444444-4444-4444-4444-444444444444',
    '20234567891',
    'CORRIENTE',
    1200000.00,
    'CLP'
);

-- Cuenta VIP para Carlos Silva
INSERT INTO cuentas_bancarias (id, cliente_id, numero_cuenta, tipo, saldo, moneda)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '66666666-6666-6666-6666-666666666666',
    '20345678901',
    'VISTA',
    5000000.00,
    'CLP'
);

-- ============================================================================
-- SIMULACIONES DE CRÉDITO
-- ============================================================================

-- Simulación 1: Juan Pérez evaluando crédito de consumo
INSERT INTO simulaciones (id, cliente_id, monto, tasa_interes, plazo_meses, cuota_mensual, total_pagar)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    5000000.00,
    4.5,
    36,
    147916.67,
    5325000.00
);

-- Simulación 2: María González evaluando crédito automotriz
INSERT INTO simulaciones (id, cliente_id, monto, tasa_interes, plazo_meses, cuota_mensual, total_pagar)
VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '44444444-4444-4444-4444-444444444444',
    15000000.00,
    3.8,
    48,
    340625.00,
    16350000.00
);

-- Simulación 3: Carlos Silva evaluando crédito hipotecario
INSERT INTO simulaciones (id, cliente_id, monto, tasa_interes, plazo_meses, cuota_mensual, total_pagar, convertido_a_solicitud)
VALUES (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '66666666-6666-6666-6666-666666666666',
    80000000.00,
    3.2,
    240,
    456666.67,
    109600000.00,
    true
);

-- ============================================================================
-- CRÉDITOS
-- ============================================================================

-- Crédito 1: Crédito de consumo APROBADO para Juan Pérez
INSERT INTO creditos (
    id, cliente_id, simulacion_id, monto_solicitado, monto_aprobado,
    tasa_interes, plazo_meses, cuota_mensual, total_pagar,
    fecha_solicitud, fecha_aprobacion, estado, tipo
)
VALUES (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    5000000.00,
    5000000.00,
    4.5,
    36,
    147916.67,
    5325000.00,
    CURRENT_TIMESTAMP - INTERVAL '10 days',
    CURRENT_TIMESTAMP - INTERVAL '8 days',
    'DESEMBOLSADO',
    'CONSUMO'
);

-- Crédito 2: Crédito automotriz APROBADO para María González
INSERT INTO creditos (
    id, cliente_id, simulacion_id, monto_solicitado, monto_aprobado,
    tasa_interes, plazo_meses, cuota_mensual, total_pagar,
    fecha_solicitud, fecha_aprobacion, fecha_desembolso, estado, tipo
)
VALUES (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '44444444-4444-4444-4444-444444444444',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    15000000.00,
    15000000.00,
    3.8,
    48,
    340625.00,
    16350000.00,
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    'DESEMBOLSADO',
    'AUTOMOTRIZ'
);

-- Crédito 3: Crédito hipotecario DESEMBOLSADO para Carlos Silva
INSERT INTO creditos (
    id, cliente_id, simulacion_id, monto_solicitado, monto_aprobado,
    tasa_interes, plazo_meses, cuota_mensual, total_pagar,
    fecha_solicitud, fecha_aprobacion, fecha_desembolso, estado, tipo
)
VALUES (
    '10101010-1010-1010-1010-101010101010',
    '66666666-6666-6666-6666-666666666666',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    80000000.00,
    80000000.00,
    3.2,
    240,
    456666.67,
    109600000.00,
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_TIMESTAMP - INTERVAL '25 days',
    CURRENT_TIMESTAMP - INTERVAL '20 days',
    'DESEMBOLSADO',
    'HIPOTECARIO'
);

-- Crédito 4: Crédito en EVALUACIÓN
INSERT INTO creditos (
    id, cliente_id, monto_solicitado, tasa_interes, plazo_meses,
    fecha_solicitud, estado, tipo
)
VALUES (
    '20202020-2020-2020-2020-202020202020',
    '44444444-4444-4444-4444-444444444444',
    10000000.00,
    4.2,
    60,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    'EVALUACION',
    'EMPRESARIAL'
);

-- ============================================================================
-- CUOTAS (Tabla de Amortización)
-- ============================================================================

-- Generar las primeras 3 cuotas para el crédito de Juan Pérez
INSERT INTO cuotas (
    credito_id, numero_cuota, monto_cuota, capital, interes, saldo_pendiente,
    fecha_vencimiento, fecha_pago, estado
)
VALUES
    -- Cuota 1 (PAGADA)
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        1,
        147916.67,
        129166.67,
        18750.00,
        4870833.33,
        CURRENT_DATE - INTERVAL '7 days',
        CURRENT_TIMESTAMP - INTERVAL '7 days',
        'PAGADA'
    ),
    -- Cuota 2 (PAGADA)
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        2,
        147916.67,
        129650.52,
        18266.15,
        4741182.81,
        CURRENT_DATE + INTERVAL '23 days',
        CURRENT_TIMESTAMP - INTERVAL '5 days',
        'PAGADA'
    ),
    -- Cuota 3 (PENDIENTE)
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        3,
        147916.67,
        130136.19,
        17780.48,
        4611046.62,
        CURRENT_DATE + INTERVAL '53 days',
        NULL,
        'PENDIENTE'
    );

-- Generar las primeras 2 cuotas para el crédito de María González
INSERT INTO cuotas (
    credito_id, numero_cuota, monto_cuota, capital, interes, saldo_pendiente,
    fecha_vencimiento, estado
)
VALUES
    -- Cuota 1 (PENDIENTE)
    (
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        1,
        340625.00,
        293125.00,
        47500.00,
        14706875.00,
        CURRENT_DATE + INTERVAL '28 days',
        'PENDIENTE'
    ),
    -- Cuota 2 (PENDIENTE)
    (
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        2,
        340625.00,
        294053.44,
        46571.56,
        14412821.56,
        CURRENT_DATE + INTERVAL '58 days',
        'PENDIENTE'
    );

-- Generar la primera cuota para el crédito hipotecario de Carlos Silva
INSERT INTO cuotas (
    credito_id, numero_cuota, monto_cuota, capital, interes, saldo_pendiente,
    fecha_vencimiento, fecha_pago, estado
)
VALUES
    (
        '10101010-1010-1010-1010-101010101010',
        1,
        456666.67,
        243333.34,
        213333.33,
        79756666.66,
        CURRENT_DATE + INTERVAL '10 days',
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        'PAGADA'
    );

-- ============================================================================
-- TRANSACCIONES
-- ============================================================================

-- Transacción 1: Pago de cuota 1 de Juan Pérez
INSERT INTO transacciones (
    cuenta_origen_id, cuota_id, tipo, monto, descripcion, referencia
)
VALUES (
    '77777777-7777-7777-7777-777777777777',
    (SELECT id FROM cuotas WHERE credito_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' AND numero_cuota = 1),
    'PAGO_CUOTA',
    147916.67,
    'Pago cuota 1/36 - Crédito Consumo',
    'TRX-2024-001'
);

-- Transacción 2: Pago de cuota 2 de Juan Pérez
INSERT INTO transacciones (
    cuenta_origen_id, cuota_id, tipo, monto, descripcion, referencia
)
VALUES (
    '77777777-7777-7777-7777-777777777777',
    (SELECT id FROM cuotas WHERE credito_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' AND numero_cuota = 2),
    'PAGO_CUOTA',
    147916.67,
    'Pago cuota 2/36 - Crédito Consumo',
    'TRX-2024-002'
);

-- Transacción 3: Depósito en cuenta de María
INSERT INTO transacciones (
    cuenta_destino_id, tipo, monto, descripcion, referencia
)
VALUES (
    '88888888-8888-8888-8888-888888888888',
    'DEPOSITO',
    1000000.00,
    'Depósito en efectivo',
    'TRX-2024-003'
);

-- Transacción 4: Transferencia de María a Juan
INSERT INTO transacciones (
    cuenta_origen_id, cuenta_destino_id, tipo, monto, descripcion, referencia
)
VALUES (
    '99999999-9999-9999-9999-999999999999',
    '77777777-7777-7777-7777-777777777777',
    'TRANSFERENCIA',
    250000.00,
    'Pago servicios',
    'TRX-2024-004'
);

-- Transacción 5: Pago de cuota hipotecaria Carlos
INSERT INTO transacciones (
    cuenta_origen_id, cuota_id, tipo, monto, descripcion, referencia
)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    (SELECT id FROM cuotas WHERE credito_id = '10101010-1010-1010-1010-101010101010' AND numero_cuota = 1),
    'PAGO_CUOTA',
    456666.67,
    'Pago cuota 1/240 - Crédito Hipotecario',
    'TRX-2024-005'
);

-- ============================================================================
-- VERIFICACIÓN DE DATOS
-- ============================================================================

-- Mostrar resumen de datos insertados
SELECT 'Usuarios' AS tabla, COUNT(*) AS registros FROM usuarios
UNION ALL
SELECT 'Clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'Cuentas Bancarias', COUNT(*) FROM cuentas_bancarias
UNION ALL
SELECT 'Simulaciones', COUNT(*) FROM simulaciones
UNION ALL
SELECT 'Créditos', COUNT(*) FROM creditos
UNION ALL
SELECT 'Cuotas', COUNT(*) FROM cuotas
UNION ALL
SELECT 'Transacciones', COUNT(*) FROM transacciones
ORDER BY tabla;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*
PASSWORDS DE PRUEBA (sin hashear, solo para referencia):
- juan.perez@email.com: Password123!
- maria.gonzalez@email.com: Premium2024!
- carlos.silva@email.com: VIP2024Secure!

IMPORTANTE: Los password_hash son placeholders.
La aplicación debe reemplazarlos con bcrypt al crear usuarios reales.

Para hashear passwords manualmente en Node.js:
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('Password123!', 10);
*/

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
