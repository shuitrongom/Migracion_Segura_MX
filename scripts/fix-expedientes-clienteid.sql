-- Diagnóstico y corrección de expedientes con clienteId incorrecto
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todos los expedientes y sus clientes asociados
SELECT 
  e.id as expediente_id,
  e.cliente_id,
  e.tramite_id,
  c.nombre_completo as cliente_nombre,
  t.numero_pieza,
  t.tipo,
  t.cliente_id as tramite_cliente_id
FROM expedientes e
LEFT JOIN clientes c ON c.id = e.cliente_id
LEFT JOIN tramites t ON t.id = e.tramite_id
ORDER BY e.created_at DESC;

-- 2. Detectar expedientes donde el clienteId del expediente NO coincide con el del trámite
SELECT 
  e.id as expediente_id,
  e.cliente_id as expediente_cliente,
  t.cliente_id as tramite_cliente,
  t.numero_pieza,
  c1.nombre_completo as nombre_en_expediente,
  c2.nombre_completo as nombre_en_tramite
FROM expedientes e
JOIN tramites t ON t.id = e.tramite_id
LEFT JOIN clientes c1 ON c1.id = e.cliente_id
LEFT JOIN clientes c2 ON c2.id = t.cliente_id
WHERE e.cliente_id != t.cliente_id;

-- 3. CORREGIR: Actualizar expedientes para que su clienteId coincida con el del trámite
UPDATE expedientes e
SET cliente_id = t.cliente_id
FROM tramites t
WHERE t.id = e.tramite_id
AND e.cliente_id != t.cliente_id;

-- 4. Verificar documentos y a qué expediente/cliente pertenecen
SELECT 
  d.id as doc_id,
  d.nombre,
  d.categoria,
  d.expediente_id,
  e.cliente_id,
  c.nombre_completo
FROM documentos d
JOIN expedientes e ON e.id = d.expediente_id
JOIN clientes c ON c.id = e.cliente_id
ORDER BY d.created_at DESC;

-- Confirmación
SELECT 'Diagnóstico completado. Si ejecutaste el UPDATE del paso 3, los expedientes ya están corregidos.' AS resultado;
