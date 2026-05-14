// ============================================================
// Shared TypeScript types for Migración Segura MX - Mobile App
// ============================================================

// --- Enums ---

export enum UserRole {
  CLIENTE = 'cliente',
  ASESOR = 'asesor',
  ADMINISTRADOR = 'administrador',
}

export enum TipoTramite {
  RESIDENCIA_TEMPORAL = 'residencia_temporal',
  RESIDENCIA_PERMANENTE = 'residencia_permanente',
  REGULARIZACION = 'regularizacion',
  CAMBIO_CONDICION = 'cambio_condicion_migratoria',
  VISA = 'visa',
  NACIONALIDAD = 'nacionalidad',
  PERMISO_TRABAJO = 'permiso_trabajo',
  RENOVACION = 'renovacion',
}

export enum EstatusTramite {
  BORRADOR = 'borrador',
  RECIBIDO = 'recibido',
  EN_REVISION = 'en_revision',
  EN_ESPERA_RESOLUCION = 'en_espera_resolucion',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  CANCELADO = 'cancelado',
}

export enum EstatusDocumento {
  PENDIENTE = 'pendiente',
  RECIBIDO = 'recibido',
  EN_REVISION = 'en_revision',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
}

export enum CanalNotificacion {
  PUSH = 'push',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
}

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

export enum ModalidadCita {
  PRESENCIAL = 'presencial',
  VIDEOLLAMADA = 'videollamada',
}

export enum EstatusCita {
  PROGRAMADA = 'programada',
  CONFIRMADA = 'confirmada',
  EN_CURSO = 'en_curso',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
  REAGENDADA = 'reagendada',
}

export enum MetodoPago {
  TRANSFERENCIA_BANCARIA = 'transferencia_bancaria',
  TARJETA_CREDITO_DEBITO = 'tarjeta_credito_debito',
  EFECTIVO = 'efectivo',
}

export enum EstatusTicket {
  ABIERTO = 'abierto',
  EN_ATENCION = 'en_atencion',
  RESUELTO = 'resuelto',
  CERRADO = 'cerrado',
}

// --- Interfaces ---

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  isVerified: boolean;
  profilePhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  nacionalidad?: string;
  fechaNacimiento?: string;
  direccion?: string;
  etiquetas: string[];
  asesorId?: string;
  asesor?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Tramite {
  id: string;
  tipo: TipoTramite;
  estatus: EstatusTramite;
  numeroPieza?: string;
  clienteId: string;
  cliente?: Cliente;
  responsableId?: string;
  responsable?: User;
  datosFormulario?: Record<string, unknown>;
  etapas?: EtapaTramite[];
  createdAt: string;
  updatedAt: string;
}

export interface EtapaTramite {
  id: string;
  tramiteId: string;
  nombre: string;
  orden: number;
  completada: boolean;
  observaciones?: string;
  fechaCompletada?: string;
  createdAt: string;
}

export interface Documento {
  id: string;
  nombre: string;
  categoria?: string;
  mimeType: string;
  tamano: number;
  estatus: EstatusDocumento;
  expedienteId: string;
  tramiteId?: string;
  subidoPorId: string;
  fechaVencimiento?: string;
  comentarioRevision?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  canal: CanalNotificacion;
  titulo: string;
  mensaje: string;
  leida: boolean;
  userId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Cita {
  id: string;
  clienteId: string;
  cliente?: Cliente;
  asesorId: string;
  asesor?: User;
  tramiteId?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  modalidad: ModalidadCita;
  estatus: EstatusCita;
  notas?: string;
  linkVideollamada?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pago {
  id: string;
  clienteId: string;
  tramiteId?: string;
  monto: number;
  metodoPago: MetodoPago;
  concepto: string;
  referencia?: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  asunto: string;
  descripcion: string;
  estatus: EstatusTicket;
  clienteId: string;
  mensajes?: MensajeTicket[];
  createdAt: string;
  updatedAt: string;
}

export interface MensajeTicket {
  id: string;
  ticketId: string;
  contenido: string;
  autorId: string;
  autor?: User;
  createdAt: string;
}

// --- Request Types ---

export interface CreateTramiteData {
  tipo: TipoTramite;
  clienteId: string;
  datosFormulario?: Record<string, unknown>;
}

export interface CreateTicketData {
  asunto: string;
  descripcion: string;
}

export interface UploadDocumentoMetadata {
  expedienteId: string;
  tramiteId?: string;
  nombre: string;
  categoria?: string;
  fechaVencimiento?: string;
}

export interface SearchNotificacionesParams {
  page?: number;
  limit?: number;
}

export interface TimelineEntry {
  id: string;
  tipo: string;
  descripcion: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface ConsultaPiezaResult {
  tramiteId: string;
  numeroPieza: string;
  tipo: string;
  estatus: string;
  ultimaActualizacion: string;
}

// --- Auth Types ---

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterResponse {
  userId: string;
  message: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
