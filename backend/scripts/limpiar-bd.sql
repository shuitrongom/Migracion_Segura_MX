-- ============================================================
-- SCRIPT: Limpiar toda la base de datos de prueba
-- Solo conserva el usuario administrador
-- ============================================================
-- ADVERTENCIA: Este script ELIMINA todos los datos excepto el admin.
-- Ejecutar solo en desarrollo/staging, NUNCA en producción con datos reales.
-- ============================================================

BEGIN;

-- 1. Eliminar datos dependientes (orden por FK)
DELETE FROM chat_messages;
DELETE FROM mensajes_ticket;
DELETE FROM tickets;
DELETE FROM log_automatizaciones;
DELETE FROM notas_internas;
DELETE FROM client_locations;
DELETE FROM etapas_tramite;
DELETE FROM tareas_internas;
DELETE FROM documentos;
DELETE FROM expedientes;
DELETE FROM pagos;
DELETE FROM acuerdos_pago;
DELETE FROM citas;
DELETE FROM notificaciones;
DELETE FROM solicitudes;
DELETE FROM tramites;
DELETE FROM beneficiarios;
DELETE FROM clientes;
DELETE FROM user_devices;
DELETE FROM activity_logs;

-- 2. Eliminar usuarios que NO son administrador
DELETE FROM users WHERE role != 'administrador';

-- 3. Limpiar plantillas de proceso (opcional — si quieres conservarlas, comenta esta línea)
-- DELETE FROM plantillas_proceso;

-- 4. Limpiar configuraciones de automatización (opcional)
-- DELETE FROM automatizacion_configs;

-- 5. Verificar qué quedó
SELECT id, email, role, full_name FROM users;

COMMIT;

-- ============================================================
-- Para ejecutar:
-- psql -h localhost -U postgres -d migracion_segura -f scripts/limpiar-bd.sql
-- O desde un cliente SQL: copiar y pegar este contenido
-- ============================================================
