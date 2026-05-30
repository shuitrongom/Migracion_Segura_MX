-- Migración: Agregar estatus 'presentado_inm' y columnas NUT
-- Ejecutar en Supabase SQL Editor

-- Agregar nuevo valor al enum estatus_tramite
ALTER TYPE estatus_tramite ADD VALUE IF NOT EXISTS 'presentado_inm' AFTER 'en_revision';

-- Agregar columnas NUT al trámite
ALTER TABLE tramites ADD COLUMN IF NOT EXISTS nut VARCHAR(100);
ALTER TABLE tramites ADD COLUMN IF NOT EXISTS nut_url VARCHAR(500);
ALTER TABLE tramites ADD COLUMN IF NOT EXISTS fecha_presentacion_inm TIMESTAMPTZ;

-- Confirmación
SELECT 'Migración presentado_inm + NUT completada' AS resultado;
