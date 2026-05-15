-- Limpiar tabla de clientes (datos de prueba)
-- CUIDADO: Esto elimina TODOS los clientes y sus datos relacionados
-- Ejecutar en la base de datos de producción

-- Primero eliminar datos dependientes
DELETE FROM notas_internas WHERE cliente_id IN (SELECT id FROM clientes);
DELETE FROM tramites WHERE cliente_id IN (SELECT id FROM clientes);
DELETE FROM clientes;

-- Verificar que quedó vacía
SELECT COUNT(*) as clientes_restantes FROM clientes;
