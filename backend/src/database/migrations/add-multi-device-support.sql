-- Migración: Soporte multi-dispositivo para push notifications
-- Fecha: 2025-07-03
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columna id como UUID
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- 2. Eliminar la constraint PK actual (user_id)
ALTER TABLE user_devices DROP CONSTRAINT IF EXISTS user_devices_pkey;

-- 3. Crear nueva PK en id
ALTER TABLE user_devices ADD PRIMARY KEY (id);

-- 4. Crear índice en user_id (ya no es PK)
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);

-- 5. Crear constraint UNIQUE en push_token (para upsert por token)
ALTER TABLE user_devices ADD CONSTRAINT user_devices_push_token_unique UNIQUE (push_token);
