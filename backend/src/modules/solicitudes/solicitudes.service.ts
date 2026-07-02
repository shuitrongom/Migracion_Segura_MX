import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Solicitud, EstatusSolicitud } from './entities/solicitud.entity';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { EmailService } from '../email/email.service';
import { MercadoPagoService } from '../financiero/mercadopago.service';
import { CanalNotificacion, TipoNotificacion } from '../../common/enums';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class SolicitudesService {
  private readonly logger = new Logger(SolicitudesService.name);

  constructor(
    @InjectRepository(Solicitud)
    private readonly solicitudRepository: Repository<Solicitud>,
    private readonly notificacionesService: NotificacionesService,
    private readonly emailService: EmailService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Extranjero crea una solicitud con sus datos
   */
  async create(dto: CreateSolicitudDto, userId: string): Promise<Solicitud> {
    // Buscar o crear clienteId
    let clienteId = dto.clienteId;
    if (!clienteId) {
      const cliente = await this.solicitudRepository.manager.query(
        `SELECT id FROM clientes WHERE user_id = $1 LIMIT 1`, [userId]
      );
      if (cliente?.[0]?.id) {
        clienteId = cliente[0].id;
      } else {
        // Crear cliente desde los datos del formulario
        const nombre = `${dto.datosFormulario?.nombre || ''} ${dto.datosFormulario?.apellidos || ''}`.trim();
        const email = (dto.datosFormulario?.email || dto.datosFormulario?.solicitanteEmail || 'pendiente@app.com') as string;
        const result = await this.solicitudRepository.manager.query(
          `INSERT INTO clientes (id, nombre_completo, email, telefono, user_id) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING id`,
          [nombre || 'Sin nombre', email, 'pendiente', userId]
        ).catch(() => null);
        clienteId = result?.[0]?.id || userId;
      }
    }

    // Obtener costo configurado
    const costo = await this.getCostoSolicitud();

    const solicitud = this.solicitudRepository.create({
      clienteId,
      userId,
      beneficiarioId: dto.beneficiarioId || null,
      tipoTramite: dto.tipoTramite,
      datosFormulario: dto.datosFormulario,
      estatus: EstatusSolicitud.PENDIENTE_REVISION,
      costo,
    });

    const saved = await this.solicitudRepository.save(solicitud);

    // Notificar al admin (push + email)
    await this.notificarAdminNuevaSolicitud(saved);

    // Email admin
    const nombre = this.getNombreExtranjero(saved);
    const tipo = (saved.tipoTramite || '').replace(/_/g, ' ');
    await this.emailService.sendAdminNotificationEmail({
      subject: `Nueva solicitud: ${tipo}`,
      event: '📋 Nueva solicitud de generación',
      details: `${nombre} solicita generación de: ${tipo}.`,
      extraInfo: `Costo: $${saved.costo} MXN · Revisar en panel de Solicitudes`,
    }).catch(() => {});

    return saved;
  }

  /**
   * Admin procesa la solicitud: sube pieza, PDF, genera pago
   */
  async procesarSolicitud(solicitudId: string, data: {
    numeroPieza: string;
    contrasenaINM?: string;
    requisitos?: string[];
    observaciones?: string;
  }, adminId: string): Promise<Solicitud> {
    const solicitud = await this.findOneOrFail(solicitudId);

    if (solicitud.estatus !== EstatusSolicitud.PENDIENTE_REVISION && solicitud.estatus !== EstatusSolicitud.EN_PROCESO) {
      throw new BadRequestException('La solicitud no está en estado válido para procesar');
    }

    solicitud.numeroPieza = data.numeroPieza;
    solicitud.contrasenaINM = data.contrasenaINM || null;
    solicitud.requisitos = data.requisitos || null;
    solicitud.observaciones = data.observaciones || null;
    solicitud.asesorId = adminId;
    solicitud.estatus = EstatusSolicitud.PENDIENTE_PAGO;

    // Costo fijo de $100 MXN para solicitudes
    solicitud.costo = 100;

    // Generar link de pago MercadoPago
    const nombreExtranjero = this.getNombreExtranjero(solicitud);
    const emailExtranjero = this.getEmailExtranjero(solicitud);

    const mpPreference = await this.mercadoPagoService.createPreference({
      tramiteId: solicitud.id,
      concepto: `Generación de solicitud INM - ${(solicitud.tipoTramite || '').replace(/_/g, ' ')}`,
      monto: 100,
      clienteNombre: nombreExtranjero,
      email: emailExtranjero,
    });

    solicitud.mercadopagoPreferenceId = mpPreference.preferenceId || null;
    solicitud.mercadopagoInitPoint = mpPreference.initPoint || mpPreference.sandboxInitPoint || null;

    const saved = await this.solicitudRepository.save(solicitud);

    // Enviar requisitos por email al extranjero
    if (emailExtranjero && data.requisitos?.length) {
      await this.emailService.sendRequisitosEmail({
        to: emailExtranjero,
        nombreExtranjero,
        requisitos: data.requisitos,
      }).catch(() => {});
    }

    // Notificar al extranjero que debe pagar
    if (solicitud.userId) {
      await this.notificacionesService.sendNotification({
        destinatarioId: solicitud.userId,
        tipo: TipoNotificacion.PAGO_PENDIENTE,
        canal: CanalNotificacion.PUSH,
        titulo: '💰 Solicitud lista — Pago pendiente',
        contenido: `Tu solicitud fue procesada. Paga $100 MXN para recibir el documento. Se te enviaron los requisitos por correo.`,
        metadata: { solicitudId: saved.id, monto: solicitud.costo.toString() },
      }).catch(() => {});
    }

    return saved;
  }

  /**
   * Confirmar pago de solicitud (webhook o manual)
   */
  async confirmarPago(solicitudId: string, paymentId?: string): Promise<Solicitud> {
    const solicitud = await this.findOneOrFail(solicitudId);

    if (solicitud.estatus !== EstatusSolicitud.PENDIENTE_PAGO) {
      throw new BadRequestException('La solicitud no está pendiente de pago');
    }

    solicitud.estatus = EstatusSolicitud.PAGADA;
    solicitud.fechaPago = new Date();
    solicitud.mercadopagoPaymentId = paymentId || 'manual';

    const saved = await this.solicitudRepository.save(solicitud);

    // Notificar al admin
    const admins = await this.solicitudRepository.manager.query(
      `SELECT id FROM users WHERE role = 'administrador' AND deleted_at IS NULL LIMIT 1`
    );
    if (admins?.[0]?.id) {
      await this.notificacionesService.sendNotification({
        destinatarioId: admins[0].id,
        tipo: TipoNotificacion.PAGO_CONFIRMADO,
        canal: CanalNotificacion.PUSH,
        titulo: '✅ Pago de solicitud confirmado',
        contenido: `El extranjero ${this.getNombreExtranjero(solicitud)} pagó $${solicitud.costo} MXN por su solicitud.`,
        metadata: { solicitudId: saved.id },
      }).catch(() => {});
    }

    // Email admin - pago de solicitud confirmado
    await this.emailService.sendAdminNotificationEmail({
      subject: `Solicitud pagada: $${solicitud.costo} MXN`,
      event: '✅ Pago de solicitud confirmado',
      details: `El extranjero ${this.getNombreExtranjero(solicitud)} pagó $${solicitud.costo} MXN por su solicitud.`,
      extraInfo: `Pieza: ${solicitud.numeroPieza || 'N/A'} · Tipo: ${(solicitud.tipoTramite || '').replace(/_/g, ' ')}`,
    }).catch(() => {});

    // Enviar PDF por email al extranjero
    const emailExtranjero = this.getEmailExtranjero(solicitud);
    if (emailExtranjero && solicitud.documentoUrl) {
      // El documento ya está subido, notificar que puede verlo
      await this.notificacionesService.sendNotification({
        destinatarioId: solicitud.userId,
        tipo: TipoNotificacion.CAMBIO_ESTATUS,
        canal: CanalNotificacion.PUSH,
        titulo: '📄 Tu solicitud está lista',
        contenido: 'Tu solicitud INM fue pagada exitosamente. Ya puedes verla y descargarla en la app.',
        metadata: { solicitudId: saved.id },
      }).catch(() => {});
    }

    return saved;
  }

  /**
   * Subir documento PDF de la solicitud
   */
  async subirDocumento(solicitudId: string, documentoUrl: string): Promise<Solicitud> {
    const solicitud = await this.findOneOrFail(solicitudId);
    solicitud.documentoUrl = documentoUrl;
    return this.solicitudRepository.save(solicitud);
  }

  /**
   * Obtener solicitudes del extranjero
   */
  async getMisSolicitudes(userId: string): Promise<Solicitud[]> {
    return this.solicitudRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtener todas las solicitudes (admin)
   */
  async findAll(page: number = 1, limit: number = 20): Promise<PaginatedResponseDto<Solicitud>> {
    const [data, total] = await this.solicitudRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Enriquecer con datos de beneficiario y usuario
    const enriched = await Promise.all(data.map(async (sol) => {
      const result: any = { ...sol };
      // Obtener beneficiario si existe
      if (sol.beneficiarioId) {
        const benef = await this.solicitudRepository.manager.query(
          `SELECT id, nombre, apellidos, parentesco, nacionalidad FROM beneficiarios WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
          [sol.beneficiarioId],
        ).catch(() => []);
        if (benef?.[0]) result.beneficiario = benef[0];
      }
      // Obtener datos de la cuenta (usuario)
      if (sol.userId) {
        const user = await this.solicitudRepository.manager.query(
          `SELECT full_name as "fullName", email FROM users WHERE id = $1 LIMIT 1`,
          [sol.userId],
        ).catch(() => []);
        if (user?.[0]) result.user = user[0];
      }
      return result;
    }));

    return new PaginatedResponseDto(enriched as any, total, page, limit);
  }

  /**
   * Obtener una solicitud por ID
   */
  async findOne(id: string): Promise<Solicitud | null> {
    return this.solicitudRepository.findOne({ where: { id } });
  }

  async findOneOrFail(id: string): Promise<Solicitud> {
    const solicitud = await this.solicitudRepository.findOne({ where: { id } });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    return solicitud;
  }

  /**
   * Reenviar link de pago al extranjero via push notification
   */
  async reenviarLinkPago(solicitudId: string): Promise<{ ok: boolean }> {
    const solicitud = await this.findOneOrFail(solicitudId);

    if (!solicitud.mercadopagoInitPoint) {
      throw new BadRequestException('Esta solicitud no tiene un link de pago generado');
    }

    // Reenviar push notification al extranjero
    if (solicitud.userId) {
      await this.notificacionesService.sendNotification({
        destinatarioId: solicitud.userId,
        tipo: TipoNotificacion.PAGO_PENDIENTE,
        canal: CanalNotificacion.PUSH,
        titulo: '💰 Recordatorio de pago — $100 MXN',
        contenido: `Tu solicitud está lista. Paga $100 MXN para recibir tu documento. Pieza: ${solicitud.numeroPieza || ''}`,
        metadata: { solicitudId: solicitud.id, initPoint: solicitud.mercadopagoInitPoint },
      }).catch(() => {});
    }

    return { ok: true };
  }

  /**
   * Obtener costo configurado (desde BD o variable de entorno)
   */
  async getCostoSolicitud(): Promise<number> {
    // Intentar leer de configuración en BD
    try {
      const config = await this.solicitudRepository.manager.query(
        `SELECT value FROM app_config WHERE key = 'costo_solicitud' LIMIT 1`
      );
      if (config?.[0]?.value) return parseFloat(config[0].value);
    } catch {}
    // Fallback a variable de entorno o default
    return parseFloat(this.configService.get<string>('COSTO_SOLICITUD', '100'));
  }

  /**
   * Actualizar costo de solicitud (admin)
   */
  async actualizarCosto(nuevoCosto: number): Promise<{ costo: number }> {
    await this.solicitudRepository.manager.query(
      `INSERT INTO app_config (key, value) VALUES ('costo_solicitud', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [nuevoCosto.toString()],
    );
    return { costo: nuevoCosto };
  }

  // --- Helpers privados ---

  /**
   * Registrar voucher de transferencia para solicitud.
   * El extranjero sube comprobante desde la app — queda en revisión para que el admin lo confirme.
   */
  async registrarVoucherSolicitud(solicitudId: string, params: {
    montoDeclarado: number;
    voucherUrl: string;
    metodoPago: string;
    userId: string;
  }): Promise<Solicitud> {
    const solicitud = await this.findOneOrFail(solicitudId);

    if (solicitud.estatus !== EstatusSolicitud.PENDIENTE_PAGO) {
      throw new BadRequestException('Esta solicitud no está pendiente de pago.');
    }

    const montoDeclarado = Number(params.montoDeclarado);
    const voucherUrl = String(params.voucherUrl || '').trim();

    if (!montoDeclarado || montoDeclarado <= 0 || isNaN(montoDeclarado)) {
      throw new BadRequestException('Debes indicar el monto que transferiste.');
    }

    if (!voucherUrl) {
      throw new BadRequestException('Debes subir el comprobante de transferencia.');
    }

    // Validar monto exacto
    const montoEsperado = Number(solicitud.costo || 100);
    if (Math.abs(montoDeclarado - montoEsperado) > 0.01) {
      throw new BadRequestException(
        `El monto ($${montoDeclarado.toFixed(2)}) no coincide con el costo ($${montoEsperado.toFixed(2)}). Transfiere exactamente $${montoEsperado.toFixed(2)} MXN.`
      );
    }

    // Guardar datos del voucher en la solicitud
    solicitud.voucherUrl = voucherUrl;
    solicitud.voucherEstatus = 'pendiente_revision';
    solicitud.metodoPago = params.metodoPago;
    solicitud.montoDeclarado = montoDeclarado;

    const saved = await this.solicitudRepository.save(solicitud);

    // Notificar al admin que hay un voucher por revisar
    const admins = await this.solicitudRepository.manager.query(
      `SELECT id FROM users WHERE role = 'administrador' AND deleted_at IS NULL LIMIT 1`
    );
    if (admins?.[0]?.id) {
      await this.notificacionesService.sendNotification({
        destinatarioId: admins[0].id,
        tipo: TipoNotificacion.PAGO_PENDIENTE,
        canal: CanalNotificacion.PUSH,
        titulo: '🧾 Voucher de solicitud pendiente',
        contenido: `Se subió comprobante de $${montoDeclarado} MXN para solicitud. Confirma el pago.`,
        metadata: { solicitudId: saved.id, monto: montoDeclarado.toString() },
      }).catch(() => {});
    }

    return saved;
  }

  private getNombreExtranjero(solicitud: Solicitud): string {
    const datos = solicitud.datosFormulario || {};
    return `${datos.nombre || ''} ${datos.apellidos || ''}`.trim() || 'Extranjero';
  }

  private getEmailExtranjero(solicitud: Solicitud): string {
    const datos = solicitud.datosFormulario || {};
    return (datos.email || datos.solicitanteEmail || '') as string;
  }

  private async notificarAdminNuevaSolicitud(solicitud: Solicitud): Promise<void> {
    const nombre = this.getNombreExtranjero(solicitud);
    const tipo = (solicitud.tipoTramite || '').replace(/_/g, ' ');

    // Push al admin
    const admins = await this.solicitudRepository.manager.query(
      `SELECT id, email FROM users WHERE role = 'administrador' AND deleted_at IS NULL LIMIT 1`
    );

    if (admins?.[0]?.id) {
      await this.notificacionesService.sendNotification({
        destinatarioId: admins[0].id,
        tipo: TipoNotificacion.CAMBIO_ESTATUS,
        canal: CanalNotificacion.PUSH,
        titulo: '🆕 Nueva solicitud de generación',
        contenido: `${nombre} solicita generación de: ${tipo}. Revisa y procesa en el panel.`,
        metadata: { solicitudId: solicitud.id, tipoTramite: solicitud.tipoTramite },
      }).catch(() => {});
      // Solo notificación push al admin - sin email de verificación
    }
  }
}
