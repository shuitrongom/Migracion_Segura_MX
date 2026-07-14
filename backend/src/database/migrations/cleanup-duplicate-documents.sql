-- Limpieza de documentos duplicados
-- Fecha: 2026-07-14
-- Ejecutar en Supabase SQL Editor
--
-- CAUSA: El error del enum 'en_revision_voucher' hacía que el pago no se actualizara,
-- pero el documento ya se había guardado. El usuario reintentaba → se creaban duplicados.
--
-- ACCIÓN: Conservar solo el documento más reciente de cada grupo (mismo nombre + mismo expediente)
-- y eliminar (soft-delete) los anteriores.

-- 1. Ver los duplicados antes de limpiar (verificación)
SELECT expediente_id, nombre, COUNT(*) as cantidad
FROM documentos
WHERE deleted_at IS NULL
GROUP BY expediente_id, nombre
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- 2. Soft-delete de duplicados: conservar solo el más reciente de cada grupo
UPDATE documentos
SET deleted_at = NOW()
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY expediente_id, nombre
                   ORDER BY created_at DESC
               ) as rn
        FROM documentos
        WHERE deleted_at IS NULL
    ) sub
    WHERE sub.rn > 1
);

-- 3. Verificar que ya no hay duplicados
SELECT expediente_id, nombre, COUNT(*) as cantidad
FROM documentos
WHERE deleted_at IS NULL
GROUP BY expediente_id, nombre
HAVING COUNT(*) > 1;
