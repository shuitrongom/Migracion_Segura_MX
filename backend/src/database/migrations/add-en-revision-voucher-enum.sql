-- Agrega el valor 'en_revision_voucher' al enum de estatus_pago en la tabla pagos
-- Fecha: 2026-07-13
-- Ejecutar en Supabase SQL Editor
--
-- NOTA: TypeORM puede generar el enum con nombre 'pagos_estatus_pago_enum' o 'estatus_pago'
-- dependiendo de cómo se creó la tabla. Este script intenta agregar el valor a ambos.

-- Intentar con el nombre que genera TypeORM automáticamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pagos_estatus_pago_enum') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'en_revision_voucher' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'pagos_estatus_pago_enum')) THEN
            ALTER TYPE pagos_estatus_pago_enum ADD VALUE 'en_revision_voucher';
        END IF;
    END IF;
END$$;

-- Intentar con el nombre creado manualmente en migrate-pagos-v2.sql
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estatus_pago') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'en_revision_voucher' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estatus_pago')) THEN
            ALTER TYPE estatus_pago ADD VALUE 'en_revision_voucher';
        END IF;
    END IF;
END$$;
