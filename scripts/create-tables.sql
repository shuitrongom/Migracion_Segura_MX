-- Migración Segura MX - Creación de tablas
-- Ejecutar en Supabase/DBeaver

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('cliente', 'asesor', 'administrador');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_tramite AS ENUM ('residencia_temporal', 'residencia_permanente', 'regularizacion', 'cambio_condicion_migratoria', 'visa', 'nacionalidad', 'permiso_trabajo', 'renovacion', 'cambio_domicilio', 'reposicion_documento', 'cambio_nacionalidad');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE estatus_tramite AS ENUM ('borrador', 'recibido', 'en_revision', 'en_espera_resolucion', 'aprobado', 'rechazado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE estatus_documento AS ENUM ('pendiente', 'recibido', 'en_revision', 'aprobado', 'rechazado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE canal_notificacion AS ENUM ('push', 'email', 'whatsapp');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_notificacion AS ENUM ('cambio_estatus', 'documento_rechazado', 'documento_faltante', 'cita_proxima', 'pago_pendiente', 'mensaje_asesor', 'documento_por_vencer', 'seguimiento_inactividad', 'felicitacion_aprobado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE modalidad_cita AS ENUM ('presencial', 'videollamada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE estatus_cita AS ENUM ('programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'reagendada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE metodo_pago AS ENUM ('transferencia_bancaria', 'tarjeta_credito_debito', 'efectivo');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE estatus_ticket AS ENUM ('abierto', 'en_atencion', 'resuelto', 'cerrado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  profile_photo_url VARCHAR(500),
  role user_role NOT NULL DEFAULT 'cliente',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_2fa_enabled BOOLEAN NOT NULL DEFAULT false,
  two_fa_secret VARCHAR(255),
  verification_code VARCHAR(6),
  verification_code_expires_at TIMESTAMPTZ,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  password_reset_token VARCHAR(255),
  password_reset_expires_at TIMESTAMPTZ,
  pending_email VARCHAR(255),
  pending_email_code VARCHAR(6),
  pending_email_expires_at TIMESTAMPTZ,
  google_id VARCHAR(255),
  apple_id VARCHAR(255),
  last_login_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  fcm_token VARCHAR(500),
  notification_preferences JSONB
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_apple_id ON users(apple_id);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  resource_id VARCHAR(100),
  ip VARCHAR(45),
  user_agent VARCHAR(500),
  details JSONB,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  user_id UUID NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  asesor_id UUID,
  etiquetas TEXT[] DEFAULT '{}',
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_clientes_user ON clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_asesor ON clientes(asesor_id);

-- Tramites
CREATE TABLE IF NOT EXISTS tramites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  cliente_id UUID NOT NULL,
  tipo tipo_tramite NOT NULL,
  estatus estatus_tramite NOT NULL DEFAULT 'borrador',
  numero_pieza VARCHAR(20) UNIQUE,
  contrasena_tramite VARCHAR(100),
  asesor_id UUID,
  responsable_id UUID,
  datos_formulario JSONB,
  fecha_cierre TIMESTAMPTZ,
  resolucion TEXT,
  comprobante_url VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_tramites_cliente ON tramites(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tramites_pieza ON tramites(numero_pieza);
CREATE INDEX IF NOT EXISTS idx_tramites_asesor ON tramites(asesor_id);

-- Etapas tramite
CREATE TABLE IF NOT EXISTS etapas_tramite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  tramite_id UUID NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  orden INT NOT NULL,
  completada BOOLEAN NOT NULL DEFAULT false,
  observaciones TEXT,
  fecha_completada TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_etapas_tramite ON etapas_tramite(tramite_id);

-- Expedientes
CREATE TABLE IF NOT EXISTS expedientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  cliente_id UUID NOT NULL,
  tramite_id UUID
);

CREATE INDEX IF NOT EXISTS idx_expedientes_cliente ON expedientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_tramite ON expedientes(tramite_id);

-- Documentos
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  expediente_id UUID NOT NULL,
  tramite_id UUID,
  nombre VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  estatus estatus_documento NOT NULL DEFAULT 'recibido',
  fecha_vencimiento DATE,
  razon_rechazo TEXT,
  revisado_por UUID,
  fecha_revision TIMESTAMPTZ,
  historial JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_documentos_expediente ON documentos(expediente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tramite ON documentos(tramite_id);

-- Notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  destinatario_id UUID NOT NULL,
  tipo tipo_notificacion NOT NULL,
  canal canal_notificacion NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  contenido TEXT NOT NULL,
  metadata JSONB,
  leida BOOLEAN NOT NULL DEFAULT false,
  fecha_envio TIMESTAMPTZ,
  enviada BOOLEAN NOT NULL DEFAULT false,
  error_envio TEXT
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_dest ON notificaciones(destinatario_id);

-- Citas
CREATE TABLE IF NOT EXISTS citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  cliente_id UUID NOT NULL,
  asesor_id UUID NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  duracion_minutos INT NOT NULL DEFAULT 30,
  modalidad modalidad_cita NOT NULL,
  estatus estatus_cita NOT NULL DEFAULT 'programada',
  notas TEXT,
  google_event_id VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_citas_cliente ON citas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_citas_asesor ON citas(asesor_id);

-- Tickets soporte
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  cliente_id UUID NOT NULL,
  asesor_id UUID,
  asunto VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  estatus estatus_ticket NOT NULL DEFAULT 'abierto'
);

CREATE INDEX IF NOT EXISTS idx_tickets_cliente ON tickets(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tickets_asesor ON tickets(asesor_id);

-- Mensajes ticket
CREATE TABLE IF NOT EXISTS mensajes_ticket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  ticket_id UUID NOT NULL,
  autor_id UUID NOT NULL,
  contenido TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mensajes_ticket ON mensajes_ticket(ticket_id);

-- Pagos
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  cliente_id UUID NOT NULL,
  tramite_id UUID,
  monto DECIMAL(12,2) NOT NULL,
  fecha DATE NOT NULL,
  metodo_pago metodo_pago NOT NULL,
  concepto VARCHAR(255) NOT NULL,
  recibo_url VARCHAR(500),
  registrado_por UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pagos_cliente ON pagos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_tramite ON pagos(tramite_id);

-- Acuerdos de pago
CREATE TABLE IF NOT EXISTS acuerdos_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  cliente_id UUID NOT NULL,
  tramite_id UUID,
  monto_total DECIMAL(12,2) NOT NULL,
  descripcion VARCHAR(500) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_acuerdos_cliente ON acuerdos_pago(cliente_id);

-- Notas internas
CREATE TABLE IF NOT EXISTS notas_internas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  cliente_id UUID NOT NULL,
  autor_id UUID NOT NULL,
  contenido TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notas_cliente ON notas_internas(cliente_id);

-- Tareas internas
CREATE TABLE IF NOT EXISTS tareas_internas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  tramite_id UUID NOT NULL,
  descripcion TEXT NOT NULL,
  responsable_id UUID NOT NULL,
  fecha_limite TIMESTAMPTZ NOT NULL,
  completada BOOLEAN NOT NULL DEFAULT false,
  fecha_completada TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tareas_tramite ON tareas_internas(tramite_id);
CREATE INDEX IF NOT EXISTS idx_tareas_responsable ON tareas_internas(responsable_id);

-- Plantillas de proceso
CREATE TABLE IF NOT EXISTS plantillas_proceso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  tipo_tramite tipo_tramite NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  etapas JSONB NOT NULL DEFAULT '[]',
  documentos_requeridos JSONB NOT NULL DEFAULT '[]',
  activa BOOLEAN NOT NULL DEFAULT true
);

-- Automatizaciones
CREATE TABLE IF NOT EXISTS automatizacion_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  tipo VARCHAR(100) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  activa BOOLEAN NOT NULL DEFAULT true,
  parametros JSONB
);

CREATE TABLE IF NOT EXISTS log_automatizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  automatizacion_id UUID NOT NULL,
  canal VARCHAR(50) NOT NULL,
  destinatario_id UUID NOT NULL,
  resultado VARCHAR(50) NOT NULL,
  detalle_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_log_auto ON log_automatizaciones(automatizacion_id);

-- Confirmación
SELECT 'Todas las tablas creadas exitosamente' AS resultado;
