// ============================================================
// Shared TypeScript types for Migración Segura MX - Admin Panel
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
  userId?: string;
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
  cliente?: Cliente;
  tramiteId?: string;
  monto: number;
  metodoPago: MetodoPago;
  concepto: string;
  referencia?: string;
  comprobante?: string;
  registradoPorId: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  asunto: string;
  descripcion: string;
  estatus: EstatusTicket;
  clienteId: string;
  cliente?: Cliente;
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

export interface NotaCliente {
  id: string;
  clienteId: string;
  contenido: string;
  autorId: string;
  autor?: User;
  createdAt: string;
  updatedAt: string;
}

export interface TareaInterna {
  id: string;
  tramiteId: string;
  titulo: string;
  descripcion?: string;
  responsableId?: string;
  responsable?: User;
  completada: boolean;
  fechaLimite?: string;
  fechaCompletada?: string;
  createdAt: string;
}

export interface PlantillaProceso {
  id: string;
  nombre: string;
  tipoTramite: TipoTramite;
  etapas: { nombre: string; orden: number }[];
  activa: boolean;
  createdAt: string;
}

export interface ActividadCliente {
  id: string;
  clienteId: string;
  tipo: string;
  descripcion: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// --- Request/Param Types ---

export interface SearchClientesParams {
  search?: string;
  etiqueta?: string;
  asesorId?: string;
  page?: number;
  limit?: number;
}

export interface SearchTramitesParams {
  estatus?: EstatusTramite;
  tipo?: TipoTramite;
  clienteId?: string;
  responsableId?: string;
  page?: number;
  limit?: number;
}

export interface SearchCitasParams {
  fechaInicio?: string;
  fechaFin?: string;
  asesorId?: string;
  page?: number;
  limit?: number;
}

export interface SearchNotificacionesParams {
  page?: number;
  limit?: number;
}

export interface CreateClienteData {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  nacionalidad?: string;
  fechaNacimiento?: string;
  direccion?: string;
  etiquetas?: string[];
  asesorId?: string;
}

export interface UpdateClienteData {
  nombre?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  nacionalidad?: string;
  fechaNacimiento?: string;
  direccion?: string;
}

export interface CreateTramiteData {
  tipo: TipoTramite;
  clienteId: string;
  datosFormulario?: Record<string, unknown>;
}

export interface UpdateEstatusData {
  estatus: EstatusTramite;
  observaciones?: string;
}

export interface CreateCitaData {
  clienteId: string;
  asesorId: string;
  tramiteId?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  modalidad: ModalidadCita;
  notas?: string;
}

export interface ReagendarCitaData {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo?: string;
}

export interface CreatePagoData {
  clienteId: string;
  tramiteId?: string;
  monto: number;
  metodoPago: MetodoPago;
  concepto: string;
  referencia?: string;
}

export interface CreateTareaInternaData {
  titulo: string;
  descripcion?: string;
  responsableId?: string;
  fechaLimite?: string;
}

export interface UploadDocumentoMetadata {
  expedienteId: string;
  tramiteId?: string;
  nombre: string;
  categoria?: string;
  fechaVencimiento?: string;
}

export interface HistorialPagosParams {
  page?: number;
  limit?: number;
}

// --- Auth Types ---

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
