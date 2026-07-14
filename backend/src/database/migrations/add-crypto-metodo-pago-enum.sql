-- Agrega el valor 'crypto' al enum de metodo_pago
-- Fecha: 2026-07-14
-- Ejecutar en Supabase SQL Editor

-- Intentar con nombre que genera TypeORM
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pagos_metodo_pago_enum') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'crypto' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'pagos_metodo_pago_enum')) THEN
            ALTER TYPE pagos_metodo_pago_enum ADD VALUE 'crypto';
        END IF;
    END IF;
END$$;

-- Intentar con nombre manual
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'metodo_pago') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'crypto' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'metodo_pago')) THEN
            ALTER TYPE metodo_pago ADD VALUE 'crypto';
        END IF;
    END IF;
END$$;
