-- Inicialización de la base de datos para desarrollo local
-- Este script se ejecuta automáticamente al crear el contenedor de PostgreSQL

-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Crear esquema de la aplicación
CREATE SCHEMA IF NOT EXISTS app;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Base de datos migracion_segura inicializada correctamente';
END $$;
