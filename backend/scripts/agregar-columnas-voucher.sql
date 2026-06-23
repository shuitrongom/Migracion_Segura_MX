-- ============================================================
-- Agregar columnas de voucher a la tabla pagos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER TABLE pagos ADD COLUMN IF NOT EXISTS voucher_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS monto_declarado DECIMAL(12,2) DEFAULT NULL;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS voucher_estatus VARCHAR(30) DEFAULT NULL;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS voucher_nota_admin VARCHAR(500) DEFAULT NULL;

-- Agregar el nuevo valor al enum de estatus_pago (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'en_revision_voucher' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'pagos_estatus_pago_enum')) THEN
        ALTER TYPE pagos_estatus_pago_enum ADD VALUE 'en_revision_voucher';
    END IF;
END$$;

-- Agregar 'crypto' al enum de metodo_pago (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'crypto' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'pagos_metodo_pago_enum')) THEN
        ALTER TYPE pagos_metodo_pago_enum ADD VALUE 'crypto';
    END IF;
END$$;

-- Verificar
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pagos' AND column_name LIKE 'voucher%' OR column_name = 'monto_declarado';
