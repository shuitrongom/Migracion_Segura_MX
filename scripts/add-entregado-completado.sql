ALTER TYPE estatus_tramite ADD VALUE IF NOT EXISTS 'entregado' AFTER 'aprobado';
ALTER TYPE estatus_tramite ADD VALUE IF NOT EXISTS 'completado' AFTER 'entregado';

-- Tabla para evaluaciones
CREATE TABLE IF NOT EXISTS evaluaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tramite_id UUID NOT NULL,
  cliente_id UUID NOT NULL,
  calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario TEXT,
  recomendaria BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_tramite ON evaluaciones(tramite_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_cliente ON evaluaciones(cliente_id);
