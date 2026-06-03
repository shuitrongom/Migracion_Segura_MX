-- Migración: Agregar sistema de beneficiarios
-- Fecha: 2026-06-03
-- Ejecutar en producción para resolver: "column tramite.beneficiario_id does not exist"

-- 1. Crear tabla de beneficiarios
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

-- 2. Agregar columna beneficiario_id a tramites
ALTER TABLE tramites ADD COLUMN IF NOT EXISTS beneficiario_id UUID REFERENCES beneficiarios(id);
CREATE INDEX IF NOT EXISTS idx_tramites_beneficiario_id ON tramites(beneficiario_id);

-- 3. Agregar columna beneficiario_id a solicitudes
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS beneficiario_id UUID REFERENCES beneficiarios(id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_beneficiario_id ON solicitudes(beneficiario_id);

-- 4. Crear tabla client_locations (geolocalización)
CREATE TABLE IF NOT EXISTS client_locations (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  ciudad VARCHAR(200),
  platform VARCHAR(20) DEFAULT 'android',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
