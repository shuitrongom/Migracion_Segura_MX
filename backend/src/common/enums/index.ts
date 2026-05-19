/**
 * Roles del sistema (Req 16.4)
 */
export enum UserRole {
  CLIENTE = 'cliente',
  ASESOR = 'asesor',
  ADMINISTRADOR = 'administrador',
}

/**
 * Tipos de trámite migratorio (Req 3.1) - Basado en INM
 */
export enum TipoTramite {
  RESIDENCIA_TEMPORAL = 'residencia_temporal',
  RESIDENCIA_PERMANENTE = 'residencia_permanente',
  REGULARIZACION = 'regularizacion',
  CAMBIO_CONDICION = 'cambio_condicion_migratoria',
  VISA = 'visa',
  NACIONALIDAD = 'nacionalidad',
  PERMISO_TRABAJO = 'permiso_trabajo',
  NOTIFICACION_CAMBIO = 'notificacion_cambio',
  EXPEDICION_DOCUMENTO = 'expedicion_documento',
  REGULARIZACION_MIGRATORIA = 'regularizacion_migratoria',
  CONSTANCIA_EMPLEADOR = 'constancia_empleador',
  CAMBIO_CONDICION_ESTANCIA = 'cambio_condicion_estancia',
  RENOVACION = 'renovacion',
  CAMBIO_DOMICILIO = 'cambio_domicilio',
  REPOSICION_DOCUMENTO = 'reposicion_documento',
  CAMBIO_NACIONALIDAD = 'cambio_nacionalidad',
}

/**
 * Estatus del trámite (Req 4.2)
 */
export enum EstatusTramite {
  BORRADOR = 'borrador',
  RECIBIDO = 'recibido',
  EN_REVISION = 'en_revision',
  EN_ESPERA_RESOLUCION = 'en_espera_resolucion',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  CANCELADO = 'cancelado',
}

/**
 * Estatus de documento (Req 5.4)
 */
export enum EstatusDocumento {
  PENDIENTE = 'pendiente',
  RECIBIDO = 'recibido',
  EN_REVISION = 'en_revision',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
}

/**
 * Canales de notificación (Req 6)
 */
export enum CanalNotificacion {
  PUSH = 'push',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
}

/**
 * Tipos de notificación (Req 6.1)
 */
export enum TipoNotificacion {
  CAMBIO_ESTATUS = 'cambio_estatus',
  DOCUMENTO_RECHAZADO = 'documento_rechazado',
  DOCUMENTO_FALTANTE = 'documento_faltante',
  CITA_PROXIMA = 'cita_proxima',
  PAGO_PENDIENTE = 'pago_pendiente',
  MENSAJE_ASESOR = 'mensaje_asesor',
  DOCUMENTO_POR_VENCER = 'documento_por_vencer',
  SEGUIMIENTO_INACTIVIDAD = 'seguimiento_inactividad',
  FELICITACION_APROBADO = 'felicitacion_aprobado',
}

/**
 * Modalidad de cita (Req 12.2)
 */
export enum ModalidadCita {
  PRESENCIAL = 'presencial',
  VIDEOLLAMADA = 'videollamada',
}

/**
 * Estatus de cita
 */
export enum EstatusCita {
  PROGRAMADA = 'programada',
  CONFIRMADA = 'confirmada',
  EN_CURSO = 'en_curso',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
  REAGENDADA = 'reagendada',
}

/**
 * Métodos de pago (Req 13.5)
 */
export enum MetodoPago {
  TRANSFERENCIA_BANCARIA = 'transferencia_bancaria',
  TARJETA_CREDITO_DEBITO = 'tarjeta_credito_debito',
  EFECTIVO = 'efectivo',
}

/**
 * Estatus de ticket de soporte
 */
export enum EstatusTicket {
  ABIERTO = 'abierto',
  EN_ATENCION = 'en_atencion',
  RESUELTO = 'resuelto',
  CERRADO = 'cerrado',
}
