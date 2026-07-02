-- Agrega campos de voucher a la tabla solicitudes para soportar pago por transferencia
-- Fecha: 2025-07-02
-- Ejecutar en Supabase SQL Editor

ALTER TABLE solicitudes
  ADD COLUMN IF NOT EXISTS "voucherUrl" VARCHAR(500) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "voucherEstatus" VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "metodoPago" VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "montoDeclarado" DECIMAL(10, 2) DEFAULT NULL;
