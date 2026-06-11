-- Migración: Agregar campo metadata JSONB a tabla users
-- Para almacenar datos del gestor (CURP, pasaporte, nacionalidad, etc.) usados en auto-relleno de solicitudes INM

ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Ejemplo de metadata para un gestor:
-- {
--   "curp": "XXXX000000XXXXXX00",
--   "nacionalidad": "Mexicana",
--   "pasaporte": "G12345678",
--   "numeroPasaporte": "G12345678",
--   "documentoOficialUrl": "https://...",
--   "direccion": "Calle X #123, Col. Centro, CDMX"
-- }
