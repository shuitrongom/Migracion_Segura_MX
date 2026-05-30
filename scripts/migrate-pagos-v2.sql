-- Migración Segura MX - Migración tabla pagos v2
-- Agrega columnas para Mercado Pago, monto_total_tramite, tipo_pago, estatus_pago
-- Ejecutar en Supabase SQL Editor o DBeaver

-- Enum tipo_pago
DO $$ BEGIN
  CREATE TYPE tipo_pago AS ENUM ('anticipo', 'liquidacion', 'pago_unico');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Enum estatus_pago
DO $$ BEGIN
  CREATE TYPE estatus_pago AS ENUM ('pendiente', 'aprobado', 'rechazado', 'cancelado', 'reembolsado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Agregar columnas nuevas a pagos
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS monto_total_tramite DECIMAL(12,2);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS tipo_pago tipo_pago DEFAULT 'pago_unico';
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS estatus_pago estatus_pago DEFAULT 'pendiente';
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS mercadopago_preference_id VARCHAR(255);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS mercadopago_payment_id VARCHAR(255);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS mercadopago_init_point VARCHAR(500);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS mercadopago_status VARCHAR(50);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS mercadopago_status_detail VARCHAR(100);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS fecha_vencimiento TIMESTAMPTZ;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS fecha_pago TIMESTAMPTZ;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS referencia VARCHAR(500);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS historial JSONB DEFAULT '[]';

-- Actualizar monto_total_tramite con el monto existente donde sea NULL
UPDATE pagos SET monto_total_tramite = monto WHERE monto_total_tramite IS NULL;

-- Hacer metodo_pago nullable (antes era NOT NULL)
ALTER TABLE pagos ALTER COLUMN metodo_pago DROP NOT NULL;

-- Confirmación
SELECT 'Migración pagos v2 completada' AS resultado;
