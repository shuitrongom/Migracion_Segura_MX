-- Agregar nuevos tipos de trámite al enum tipo_tramite
-- Ejecutar en la base de datos de producción

ALTER TYPE tipo_tramite ADD VALUE IF NOT EXISTS 'cambio_domicilio';
ALTER TYPE tipo_tramite ADD VALUE IF NOT EXISTS 'reposicion_documento';
ALTER TYPE tipo_tramite ADD VALUE IF NOT EXISTS 'cambio_nacionalidad';
