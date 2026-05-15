-- Agregar columna tipo a la tabla de citas
ALTER TABLE citas ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'entrevista';
