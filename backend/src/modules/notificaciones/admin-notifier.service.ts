import { Injectable, Logger } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { EmailService } from '../email/email.service';
import { CanalNotificacion, TipoNotificacion } from '../../common/enums';

/**
 * Servicio centralizado para notificar al administrador de CUALQUIER actividad.
 * Envía push notification + email en cada evento.
 */
@Injectable()
export class AdminNotifierService {
  private readonly logger = new Logger(AdminNotifierService.name);

  constructor(
    private readonly notificacionesService: NotificacionesService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Notificar al admin de un evento — push + email + registro en BD
   */
  async notify(params: {
    titulo: string;
    contenido: string;
    tipo?: TipoNotificacion;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { titulo, contenido, tipo, metadata } = params;

    try {
      // 1. Buscar admin ID
      const admins = await this.notificacionesService['notificacionRepository'].manager.query(
        `SELECT id FROM users WHERE role = 'administrador' AND deleted_at IS NULL LIMIT 1`
      );
      const adminId = admins?.[0]?.id;

      // 2. Enviar push notification al admin (queda registrada en BD también)
      if (adminId) {
        await this.notificacionesService.sendNotification({
          destinatarioId: adminId,
          tipo: tipo || TipoNotificacion.CAMBIO_ESTATUS,
          canal: CanalNotificacion.PUSH,
          titulo,
          contenido,
          metadata,
        }).catch(() => {});
      }

      // 3. Enviar email al admin
      await this.emailService.sendAdminNotificationEmail({
        subject: titulo,
        event: titulo,
        details: contenido,
        extraInfo: metadata ? Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join(' · ') : undefined,
      }).catch(() => {});

      this.logger.log(`[Admin Notificado] ${titulo}`);
    } catch (error: any) {
      this.logger.error(`Error notificando admin: ${error.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Métodos específicos por evento
  // ═══════════════════════════════════════════════════════════════════════════

  async nuevoTramite(nombre: string, tipo: string, tramiteId: string) {
    await this.notify({
      titulo: '📄 Nuevo trámite recibido',
      contenido: `${nombre} inició un trámite de ${tipo.replace(/_/g, ' ')}.`,
      tipo: TipoNotificacion.CAMBIO_ESTATUS,
      metadata: { tramiteId, nombre, tipo },
    });
  }

  async nuevaSolicitud(nombre: string, tipo: string, solicitudId: string) {
    await this.notify({
      titulo: '📝 Nueva solicitud recibida',
      contenido: `${nombre} envió una solicitud de ${tipo.replace(/_/g, ' ')}. Costo: $100 MXN.`,
      tipo: TipoNotificacion.CAMBIO_ESTATUS,
      metadata: { solicitudId, nombre, tipo },
    });
  }

  async pagoConfirmado(monto: number, metodo: string, tramiteId: string) {
    await this.notify({
      titulo: '💰 Pago confirmado',
      contenido: `Se confirmó un pago de $${monto} MXN. Método: ${metodo}.`,
      tipo: TipoNotificacion.PAGO_CONFIRMADO,
      metadata: { tramiteId, monto: monto.toString(), metodo },
    });
  }

  async voucherSubido(monto: number, metodo: string, pagoId: string) {
    await this.notify({
      titulo: '🧾 Voucher pendiente de revisión',
      contenido: `Se subió un comprobante de $${monto} MXN (${metodo}). Revisa y aprueba o rechaza.`,
      tipo: TipoNotificacion.PAGO_PENDIENTE,
      metadata: { pagoId, monto: monto.toString() },
    });
  }

  async documentoSubido(nombre: string, categoria: string, tramiteId?: string) {
    await this.notify({
      titulo: '📎 Documento subido',
      contenido: `Se subió el documento "${nombre}" (${categoria}).`,
      tipo: TipoNotificacion.CAMBIO_ESTATUS,
      metadata: { tramiteId: tramiteId || '', nombre, categoria },
    });
  }

  async nuevoMensajeChat(nombreCliente: string, mensaje: string) {
    await this.notify({
      titulo: '💬 Nuevo mensaje de cliente',
      contenido: `${nombreCliente}: "${mensaje.slice(0, 100)}${mensaje.length > 100 ? '...' : ''}"`,
      tipo: TipoNotificacion.MENSAJE_ASESOR,
      metadata: { nombreCliente },
    });
  }

  async nuevoTicketSoporte(asunto: string, clienteNombre: string) {
    await this.notify({
      titulo: '🎫 Nuevo ticket de soporte',
      contenido: `${clienteNombre} abrió un ticket: "${asunto}"`,
      tipo: TipoNotificacion.CAMBIO_ESTATUS,
      metadata: { asunto, clienteNombre },
    });
  }

  async clienteRegistrado(nombre: string, email: string) {
    await this.notify({
      titulo: '👤 Nuevo usuario registrado',
      contenido: `${nombre} (${email}) se registró en la app.`,
      tipo: TipoNotificacion.CAMBIO_ESTATUS,
      metadata: { nombre, email },
    });
  }

  async beneficiarioRegistrado(nombre: string, propietario: string) {
    await this.notify({
      titulo: '👥 Nuevo extranjero registrado',
      contenido: `${propietario} registró al extranjero: ${nombre}.`,
      tipo: TipoNotificacion.CAMBIO_ESTATUS,
      metadata: { nombre, propietario },
    });
  }
}
