-- Migración Segura MX - Crear tabla solicitudes
-- Ejecutar en Supabase SQL Editor o DBeaver

-- Enum estatus_solicitud
DO $$ BEGIN
  CREATE TYPE estatus_solicitud AS ENUM ('pendiente_revision', 'en_proceso', 'pendiente_pago', 'pagada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tabla solicitudes (generación de solicitudes INM por extranjeros)
CREATE TABLE IF NOT EXISTS solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clienteId" UUID NOT NULL,
  "userId" UUID,
  "tipoTramite" VARCHAR(100) NOT NULL,
  "datosFormulario" JSONB,
  estatus estatus_solicitud NOT NULL DEFAULT 'pendiente_revision',
  "numeroPieza" VARCHAR(50),
  "contrasenaINM" VARCHAR(100),
  "documentoUrl" VARCHAR(500),
  costo DECIMAL(10,2) DEFAULT 100,
  "mercadopagoPreferenceId" VARCHAR(255),
  "mercadopagoInitPoint" VARCHAR(500),
  "mercadopagoPaymentId" VARCHAR(100),
  "fechaPago" TIMESTAMPTZ,
  "asesorId" UUID,
  requisitos JSONB,
  observaciones TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_solicitudes_cliente ON solicitudes("clienteId");
CREATE INDEX IF NOT EXISTS idx_solicitudes_user ON solicitudes("userId");
CREATE INDEX IF NOT EXISTS idx_solicitudes_estatus ON solicitudes(estatus);

-- Tabla app_config (para almacenar costo de solicitud configurable)
CREATE TABLE IF NOT EXISTS app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar costo default
INSERT INTO app_config (key, value) VALUES ('costo_solicitud', '{"monto": 100}')
ON CONFLICT (key) DO NOTHING;

-- Confirmación
SELECT 'Tabla solicitudes y app_config creadas exitosamente' AS resultado;
