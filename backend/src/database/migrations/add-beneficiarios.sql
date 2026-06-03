-- ===========================================================================
-- MIGRACIÓN COMPLETA: Reset de datos + nuevas tablas
-- Fecha: 2026-06-03
-- Propósito: Vaciar todas las tablas y crear estructura para beneficiarios
-- ===========================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 1: VACIAR TODAS LAS TABLAS (orden por dependencias FK)
-- ═══════════════════════════════════════════════════════════════════════════

TRUNCATE TABLE notificaciones CASCADE;
TRUNCATE TABLE notas_internas CASCADE;
TRUNCATE TABLE etapas_tramite CASCADE;
TRUNCATE TABLE tareas_internas CASCADE;
TRUNCATE TABLE documentos CASCADE;
TRUNCATE TABLE expedientes CASCADE;
TRUNCATE TABLE pagos CASCADE;
TRUNCATE TABLE solicitudes CASCADE;
TRUNCATE TABLE tramites CASCADE;
TRUNCATE TABLE citas CASCADE;
TRUNCATE TABLE tickets_soporte CASCADE;
TRUNCATE TABLE mensajes_soporte CASCADE;
TRUNCATE TABLE chat_mensajes CASCADE;
TRUNCATE TABLE chat_rooms CASCADE;
TRUNCATE TABLE activity_logs CASCADE;
TRUNCATE TABLE user_devices CASCADE;
TRUNCATE TABLE clientes CASCADE;
TRUNCATE TABLE beneficiarios CASCADE;
TRUNCATE TABLE client_locations CASCADE;

-- NO truncar la tabla users para no perder tu cuenta de admin
-- Si quieres borrar clientes (usuarios con role='cliente'), descomentar:
-- DELETE FROM users WHERE role = 'cliente';

-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 2: CREAR TABLAS NUEVAS (si no existen)
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabla de beneficiarios (extranjeros reales)
CREATE TABLE IF NOT EXISTS beneficiarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  parentesco VARCHAR(50) DEFAULT 'yo_mismo',
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  sexo VARCHAR(10),
  fecha_nacimiento VARCHAR(20),
  nacionalidad VARCHAR(80),
  estado_civil VARCHAR(30),
  pais_nacimiento VARCHAR(80),
  tipo_documento VARCHAR(50),
  numero_documento VARCHAR(50),
  pais_expedicion VARCHAR(80),
  fecha_vencimiento_doc VARCHAR(20),
  curp VARCHAR(20),
  email VARCHAR(100),
  telefono VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_beneficiarios_user_id ON beneficiarios(user_id);
CREATE INDEX IF NOT EXISTS idx_beneficiarios_curp ON beneficiarios(curp);

-- Tabla de geolocalización de clientes
CREATE TABLE IF NOT EXISTS client_locations (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  ciudad VARCHAR(200),
  platform VARCHAR(20) DEFAULT 'android',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 3: AGREGAR COLUMNAS NUEVAS A TABLAS EXISTENTES
-- ═══════════════════════════════════════════════════════════════════════════

-- Columna beneficiario_id en tramites
ALTER TABLE tramites ADD COLUMN IF NOT EXISTS beneficiario_id UUID REFERENCES beneficiarios(id);
CREATE INDEX IF NOT EXISTS idx_tramites_beneficiario_id ON tramites(beneficiario_id);

-- Columna beneficiario_id en solicitudes
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS beneficiario_id UUID REFERENCES beneficiarios(id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_beneficiario_id ON solicitudes(beneficiario_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- LISTO. Base de datos limpia y lista para los nuevos flujos.
-- ═══════════════════════════════════════════════════════════════════════════
