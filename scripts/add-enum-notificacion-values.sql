-- Agregar valores faltantes al enum tipo_notificacion en la BD
-- Ejecutar en Supabase SQL Editor

ALTER TYPE tipo_notificacion ADD VALUE IF NOT EXISTS 'pago_confirmado';
ALTER TYPE tipo_notificacion ADD VALUE IF NOT EXISTS 'cita_programada';

SELECT 'Enum tipo_notificacion actualizado' AS resultado;
