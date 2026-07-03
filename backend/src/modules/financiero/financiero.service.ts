import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';

import { Pago, EstatusPago, TipoPago } from './entities/pago.entity';
import { AcuerdoPago } from './entities/acuerdo-pago.entity';
import { MercadoPagoService } from './mercadopago.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { MetodoPago, CanalNotificacion, TipoNotificacion } from '../../common/enums';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class FinancieroService {
  private readonly logger = new Logger(FinancieroService.name);

  constructor(
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(AcuerdoPago)
    private readonly acuerdoPagoRepository: Repository<AcuerdoPago>,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly notificacionesService: NotificacionesService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Generar pagos divididos (1 a 4 parcialidades)
   * El admin elige cuántas parcialidades. Se genera link de MP solo para el primer pago.
   * Los siguientes se generan conforme avanza el trámite.
   */
  async generarPagosDivididos(params: {
    tramiteId: string;
    clienteId: string;
    montoTotal: number;
    concepto: string;
    clienteNombre: string;
    email: string;
    numeroPagos: number;
    registradoPor: string;
  }): Promise<{ pagos: Pago[] }> {
    const numPagos = Math.min(Math.max(params.numeroPagos, 1), 4); // Limitar entre 1 y 4
    const montoPorPago = Math.round((params.montoTotal / numPagos) * 100) / 100;
    // Ajustar último pago para que sume exacto
    const montos: number[] = [];
    for (let i = 0; i < numPagos; i++) {
      if (i === numPagos - 1) {
        montos.push(Math.round((params.montoTotal - montos.reduce((s, m) => s + m, 0)) * 100) / 100);
      } else {
        montos.push(montoPorPago);
      }
    }

    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 15);

    // Crear link de Mercado Pago solo para el PRIMER pago
    const mpPreference = await this.mercadoPagoService.createPreference({
      tramiteId: params.tramiteId,
      concepto: numPagos === 1
        ? params.concepto
        : `Pago 1 de ${numPagos} - ${params.concepto}`,
      monto: montos[0],
      clienteNombre: params.clienteNombre,
      email: params.email,
    });

    const pagosCreados: Pago[] = [];

    for (let i = 0; i < numPagos; i++) {
      const esElPrimero = i === 0;
      const tipoPago = numPagos === 1
        ? TipoPago.PAGO_UNICO
        : i === 0
          ? TipoPago.ANTICIPO
          : TipoPago.LIQUIDACION;

      const pago = this.pagoRepository.create({
        clienteId: params.clienteId,
        tramiteId: params.tramiteId,
        montoTotalTramite: params.montoTotal,
        monto: montos[i],
        fecha: new Date(),
        tipoPago,
        estatusPago: EstatusPago.PENDIENTE,
        concepto: numPagos === 1
          ? params.concepto
          : `Pago ${i + 1} de ${numPagos} - ${params.concepto}`,
        mercadopagoPreferenceId: esElPrimero ? mpPreference.preferenceId : null,
        mercadopagoInitPoint: esElPrimero ? (mpPreference.initPoint) : null,
        fechaVencimiento: esElPrimero ? fechaVencimiento : null, // Solo el primero tiene vencimiento
        registradoPor: params.registradoPor,
        historial: [{
          accion: 'CREADO',
          fecha: new Date().toISOString(),
          usuarioId: params.registradoPor,
          detalle: esElPrimero
            ? `Pago ${i + 1} de ${numPagos} generado por $${montos[i]} MXN. Link de pago enviado. Vence: ${fechaVencimiento.toISOString().slice(0, 10)}`
            : `Pago ${i + 1} de ${numPagos} programado por $${montos[i]} MXN. Se activará al avanzar el trámite.`,
        }],
      });

      const saved = await this.pagoRepository.save(pago);
      pagosCreados.push(saved);
    }

    // Notificar al extranjero del primer pago
    if (params.clienteId) {
      try {
        const cliente = await this.pagoRepository.manager.query(
          `SELECT user_id FROM clientes WHERE id = $1`, [params.clienteId]
        );
        if (cliente?.[0]?.user_id) {
          await this.notificacionesService.sendNotification({
            destinatarioId: cliente[0].user_id,
            tipo: TipoNotificacion.PAGO_PENDIENTE,
            canal: CanalNotificacion.PUSH,
            titulo: '💰 Pago pendiente generado',
            contenido: numPagos === 1
              ? `Se generó un pago de $${montos[0]} MXN para tu trámite. Tienes 15 días para realizarlo.`
              : `Se generó el pago 1 de ${numPagos} por $${montos[0]} MXN. Total del trámite: $${params.montoTotal} MXN.`,
            metadata: { tramiteId: params.tramiteId, monto: montos[0].toString(), totalPagos: numPagos.toString() },
          }).catch(() => {});
        }
      } catch {}
    }

    return { pagos: pagosCreados };
  }

  /**
   * Generar link de pago para el SIGUIENTE pago pendiente sin link.
   * El admin llama esto cuando es momento de cobrar el siguiente pago.
   * Genera un link nuevo de Mercado Pago con 15 días de vigencia.
   */
  async generarLinkLiquidacion(params: {
    tramiteId: string;
    clienteNombre: string;
    email: string;
    registradoPor: string;
  }): Promise<Pago> {
    // Buscar el siguiente pago pendiente que NO tenga link activo
    const siguientePago = await this.pagoRepository.findOne({
      where: { tramiteId: params.tramiteId, estatusPago: EstatusPago.PENDIENTE, mercadopagoInitPoint: IsNull() },
      order: { createdAt: 'ASC' },
    });

    // Si no hay pago sin link, buscar cualquier pendiente (puede que el link anterior venció)
    const pago = siguientePago || await this.pagoRepository.findOne({
      where: { tramiteId: params.tramiteId, estatusPago: EstatusPago.PENDIENTE },
      order: { createdAt: 'ASC' },
    });

    if (!pago) {
      throw new NotFoundException('No hay pagos pendientes para este trámite');
    }

    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 15);

    const mpPreference = await this.mercadoPagoService.createPreference({
      tramiteId: params.tramiteId,
      concepto: pago.concepto,
      monto: Number(pago.monto),
      clienteNombre: params.clienteNombre,
      email: params.email,
    });

    pago.mercadopagoPreferenceId = mpPreference.preferenceId || null;
    pago.mercadopagoInitPoint = mpPreference.initPoint || null;
    pago.fechaVencimiento = fechaVencimiento;
    pago.historial = [
      ...pago.historial,
      {
        accion: 'LINK_GENERADO',
        fecha: new Date().toISOString(),
        usuarioId: params.registradoPor,
        detalle: `Link de pago generado por $${pago.monto} MXN. Vence: ${fechaVencimiento.toISOString().slice(0, 10)}`,
      },
    ];

    const saved = await this.pagoRepository.save(pago);

    // Notificar al extranjero que tiene un nuevo pago disponible
    try {
      if (pago.clienteId) {
        const cliente = await this.pagoRepository.manager.query(
          `SELECT user_id FROM clientes WHERE id = $1`, [pago.clienteId]
        );
        if (cliente?.[0]?.user_id) {
          await this.notificacionesService.sendNotification({
            destinatarioId: cliente[0].user_id,
            tipo: TipoNotificacion.PAGO_PENDIENTE,
            canal: CanalNotificacion.PUSH,
            titulo: '💰 Nuevo pago disponible',
            contenido: `Se generó tu siguiente pago: $${Number(pago.monto).toLocaleString()} MXN. Tienes 15 días para realizarlo.`,
            metadata: { tramiteId: params.tramiteId, monto: pago.monto.toString() },
          }).catch(() => {});
        }
      }
    } catch {}

    return saved;
  }

  /**
   * Procesar webhook de Mercado Pago — marcar pago como aprobado
   */
  async procesarPagoAprobado(mercadopagoPaymentId: string, tramiteId: string, amount: number, paymentMethod: string): Promise<void> {
    // Buscar el pago pendiente para este trámite
    const pago = await this.pagoRepository.findOne({
      where: { tramiteId, estatusPago: EstatusPago.PENDIENTE },
      order: { createdAt: 'ASC' }, // El más antiguo primero (anticipo antes que liquidación)
    });

    if (!pago) {
      this.logger.warn(`Webhook MP: No se encontró pago pendiente para tramiteId=${tramiteId} (paymentId=${mercadopagoPaymentId}). Puede ser duplicado o solicitud.`);
      return;
    }

    pago.estatusPago = EstatusPago.APROBADO;
    pago.mercadopagoPaymentId = mercadopagoPaymentId || null;
    pago.mercadopagoStatus = 'approved';
    pago.fechaPago = new Date();
    pago.metodoPago = MetodoPago.TARJETA_CREDITO_DEBITO;
    pago.referencia = `MP-${mercadopagoPaymentId}` || null;
    pago.historial = [
      ...pago.historial,
      {
        accion: 'PAGO_APROBADO',
        fecha: new Date().toISOString(),
        usuarioId: 'mercadopago-webhook',
        detalle: `Pago aprobado por Mercado Pago. ID: ${mercadopagoPaymentId}. Método: ${paymentMethod}. Monto: $${amount}`,
      },
    ];

    await this.pagoRepository.save(pago);

    // Notificar al admin y al extranjero que el pago fue aprobado
    try {
      // Notificar al admin
      const admins = await this.pagoRepository.manager.query(
        `SELECT id FROM users WHERE role = 'administrador' AND deleted_at IS NULL LIMIT 1`
      );
      if (admins?.[0]?.id) {
        await this.notificacionesService.sendNotification({
          destinatarioId: admins[0].id,
          tipo: TipoNotificacion.PAGO_CONFIRMADO,
          canal: CanalNotificacion.PUSH,
          titulo: '✅ Pago recibido',
          contenido: `Se confirmó un pago de $${amount} MXN para el trámite. Método: ${paymentMethod}`,
          metadata: { tramiteId, monto: amount.toString() },
        }).catch(() => {});
      }
      // Notificar al extranjero
      if (pago.clienteId) {
        const cliente = await this.pagoRepository.manager.query(
          `SELECT user_id FROM clientes WHERE id = $1`, [pago.clienteId]
        );
        if (cliente?.[0]?.user_id) {
          await this.notificacionesService.sendNotification({
            destinatarioId: cliente[0].user_id,
            tipo: TipoNotificacion.PAGO_CONFIRMADO,
            canal: CanalNotificacion.PUSH,
            titulo: '✅ Tu pago fue confirmado',
            contenido: `Tu pago de $${amount} MXN ha sido procesado exitosamente.`,
            metadata: { tramiteId, monto: amount.toString() },
          }).catch(() => {});
        }
      }
    } catch {}

    // Notificar al admin por email
    try {
      await this.emailService.sendAdminNotificationEmail({
        subject: `Pago confirmado: $${amount} MXN`,
        event: '💰 Pago confirmado vía Mercado Pago',
        details: `Se confirmó un pago de $${amount} MXN para el trámite ${tramiteId}.`,
        extraInfo: `ID Pago MP: ${mercadopagoPaymentId} · Método: ${paymentMethod}`,
      });
    } catch (e: any) {
      this.logger.warn(`No se pudo enviar email de pago confirmado: ${e.message}`);
    }
  }

  /**
   * Notificar al cliente cuando su pago fue rechazado o cancelado
   */
  async notificarPagoRechazado(refId: string, status: string): Promise<void> {
    try {
      const tramite = await this.pagoRepository.manager.query(
        `SELECT t.id, t.cliente_id, c.user_id FROM tramites t
         LEFT JOIN clientes c ON c.id = t.cliente_id
         WHERE t.id = $1 LIMIT 1`,
        [refId],
      );
      const userId = tramite?.[0]?.user_id;
      if (userId) {
        const msg =
          status === 'rejected'
            ? 'Tu pago fue rechazado. Puedes intentarlo de nuevo con el mismo link.'
            : 'Tu pago fue cancelado.';
        await this.notificacionesService
          .sendNotification({
            destinatarioId: userId,
            tipo: TipoNotificacion.PAGO_PENDIENTE,
            canal: CanalNotificacion.PUSH,
            titulo: status === 'rejected' ? '❌ Pago rechazado' : '🚫 Pago cancelado',
            contenido: msg,
            metadata: { tramiteId: refId, status },
          })
          .catch(() => {});
      }
    } catch {}
  }

  /**
   * Obtener userId a partir del ID de un trámite o solicitud
   */
  async getUserIdByTramiteOrSolicitud(refId: string): Promise<string | null> {
    try {
      const result = await this.pagoRepository.manager.query(
        `SELECT c.user_id FROM tramites t LEFT JOIN clientes c ON c.id = t.cliente_id WHERE t.id = $1 LIMIT 1`,
        [refId],
      );
      return result?.[0]?.user_id || null;
    } catch {
      return null;
    }
  }

  /**
   * Cancelar pagos vencidos (más de 15 días sin pagar)
   * Se ejecuta periódicamente o al consultar
   */
  async cancelarPagosVencidos(): Promise<number> {
    const ahora = new Date();
    const vencidos = await this.pagoRepository.find({
      where: {
        estatusPago: EstatusPago.PENDIENTE,
        fechaVencimiento: LessThan(ahora),
      },
    });

    for (const pago of vencidos) {
      pago.estatusPago = EstatusPago.CANCELADO;
      pago.historial = [
        ...pago.historial,
        {
          accion: 'CANCELADO_POR_VENCIMIENTO',
          fecha: new Date().toISOString(),
          usuarioId: 'sistema',
          detalle: `Pago cancelado automáticamente por no pagarse en 15 días.`,
        },
      ];
      await this.pagoRepository.save(pago);
    }

    return vencidos.length;
  }

  /**
   * Obtener pagos de un trámite
   */
  async getPagosByTramite(tramiteId: string): Promise<Pago[]> {
    return this.pagoRepository.find({
      where: { tramiteId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Req 13.1 - Registrar pago manual (admin)
   */
  async registrarPago(dto: CreatePagoDto, registradoPor: string): Promise<Pago> {
    const pago = this.pagoRepository.create({
      clienteId: dto.clienteId,
      tramiteId: dto.tramiteId ?? null,
      montoTotalTramite: dto.monto,
      monto: dto.monto,
      fecha: dto.fecha as unknown as Date,
      metodoPago: dto.metodoPago,
      concepto: dto.concepto,
      tipoPago: TipoPago.PAGO_UNICO,
      estatusPago: EstatusPago.APROBADO,
      registradoPor,
      fechaPago: new Date(),
      historial: [{
        accion: 'PAGO_MANUAL',
        fecha: new Date().toISOString(),
        usuarioId: registradoPor,
        detalle: `Pago registrado manualmente por admin. Monto: $${dto.monto}`,
      }],
    });

    return this.pagoRepository.save(pago);
  }

  /**
   * Req 13.3 - Saldo pendiente de un cliente
   */
  async getSaldoPendiente(clienteId: string) {
    const pagos = await this.pagoRepository.find({ where: { clienteId } });
    const totalCobrado = pagos.filter(p => p.estatusPago === EstatusPago.APROBADO).reduce((sum, p) => sum + Number(p.monto), 0);
    const totalPendiente = pagos.filter(p => p.estatusPago === EstatusPago.PENDIENTE || p.estatusPago === EstatusPago.EN_REVISION_VOUCHER).reduce((sum, p) => sum + Number(p.monto), 0);
    const totalGeneral = pagos.reduce((sum, p) => sum + Number(p.montoTotalTramite || p.monto), 0) / 2; // Evitar doble conteo

    return { montoTotal: totalGeneral, montoPagado: totalCobrado, saldoPendiente: totalPendiente };
  }

  /**
   * Req 13.6 - Historial de pagos de un cliente
   */
  async getHistorialByCliente(clienteId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponseDto<Pago>> {
    const [data, total] = await this.pagoRepository.findAndCount({
      where: { clienteId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return new PaginatedResponseDto(data, total, page, limit);
  }

  /**
   * Req 13.7 - Reporte mensual
   */
  async getReporteMensual(mes: number, anio: number) {
    const startDate = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const endDate = mes === 12 ? `${anio + 1}-01-01` : `${anio}-${String(mes + 1).padStart(2, '0')}-01`;

    const pagos = await this.pagoRepository
      .createQueryBuilder('pago')
      .where('pago.fecha >= :startDate AND pago.fecha < :endDate', { startDate, endDate })
      .andWhere('pago.estatusPago = :estatus', { estatus: EstatusPago.APROBADO })
      .getMany();

    const totalIngresos = pagos.reduce((sum, p) => sum + Number(p.monto), 0);
    const porMetodo: Record<string, { total: number; cantidad: number }> = {};
    pagos.forEach(p => {
      const key = p.metodoPago || 'sin_metodo';
      if (!porMetodo[key]) porMetodo[key] = { total: 0, cantidad: 0 };
      porMetodo[key].total += Number(p.monto);
      porMetodo[key].cantidad += 1;
    });

    return {
      mes, anio, totalIngresos,
      totalPagos: pagos.length,
      porMetodo: Object.entries(porMetodo).map(([metodoPago, data]) => ({ metodoPago, ...data })),
    };
  }

  /**
   * Registrar voucher de transferencia
   * BLINDADO: El monto declarado debe coincidir EXACTAMENTE con el monto del pago.
   * Sin monto correcto + sin voucher = no se registra NADA.
   */
  async registrarVoucher(params: {
    pagoId: string;
    montoDeclarado: number;
    voucherUrl: string;
    metodoPago: string;
    userId: string;
  }): Promise<Pago> {
    // Normalizar tipos — el cliente puede enviar string desde la app
    const montoDeclarado = Number(params.montoDeclarado);
    const voucherUrl = String(params.voucherUrl || '').trim();

    // Validar que se envía monto
    if (!montoDeclarado || montoDeclarado <= 0 || isNaN(montoDeclarado)) {
      throw new BadRequestException('Debes indicar el monto que transferiste. Sin monto no se puede registrar el pago.');
    }

    // Validar que se envía voucher
    if (!voucherUrl) {
      throw new BadRequestException('Debes subir el comprobante de transferencia (voucher). Sin comprobante no se registra el pago.');
    }

    const pago = await this.pagoRepository.findOne({ where: { id: params.pagoId } });
    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    // Verificar que el usuario sea dueño del pago (solo para clientes)
    if (pago.clienteId) {
      const clienteRows = await this.pagoRepository.manager.query(
        `SELECT id FROM clientes WHERE user_id = $1 AND id = $2 LIMIT 1`,
        [params.userId, pago.clienteId],
      );
      // Si no es el dueño y no es admin/asesor, verificamos que al menos el user tenga un cliente vinculado
      if (!clienteRows?.length) {
        const userRole = await this.pagoRepository.manager.query(
          `SELECT role FROM users WHERE id = $1 LIMIT 1`, [params.userId]
        );
        if (userRole?.[0]?.role === 'cliente') {
          throw new BadRequestException('No tienes permiso para modificar este pago.');
        }
      }
    }

    if (pago.estatusPago !== EstatusPago.PENDIENTE) {
      throw new BadRequestException('Este pago ya no está pendiente. No se puede subir voucher.');
    }

    // VALIDACIÓN: El monto declarado DEBE ser EXACTO al monto del pago
    const montoEsperado = Number(pago.monto);

    if (Math.abs(montoDeclarado - montoEsperado) > 0.01) {
      throw new BadRequestException(
        `El monto que ingresaste ($${montoDeclarado.toFixed(2)}) no coincide con el monto a pagar ($${montoEsperado.toFixed(2)}). ` +
        `Debes transferir EXACTAMENTE $${montoEsperado.toFixed(2)} MXN. ` +
        `Si ya transferiste una cantidad diferente, contacta a tu asesor.`
      );
    }

    // Registrar voucher — queda en revisión
    pago.voucherUrl = voucherUrl;
    pago.montoDeclarado = montoDeclarado;
    pago.voucherEstatus = 'pendiente_revision';
    pago.estatusPago = EstatusPago.EN_REVISION_VOUCHER;
    pago.metodoPago = params.metodoPago === 'crypto'
      ? MetodoPago.CRYPTO
      : MetodoPago.TRANSFERENCIA_BANCARIA;
    pago.historial = [
      ...(pago.historial || []),
      {
        accion: 'VOUCHER_SUBIDO',
        fecha: new Date().toISOString(),
        usuarioId: params.userId,
        detalle: `Voucher subido. Monto: $${montoDeclarado}. Método: ${params.metodoPago}. En espera de revisión.`,
      },
    ];

    const saved = await this.pagoRepository.save(pago);

    // Notificar al admin (no bloquea si falla)
    this.pagoRepository.manager.query(
      `SELECT id FROM users WHERE role = 'administrador' AND deleted_at IS NULL LIMIT 1`
    ).then((admins: any[]) => {
      if (admins?.[0]?.id) {
        this.notificacionesService.sendNotification({
          destinatarioId: admins[0].id,
          tipo: TipoNotificacion.PAGO_PENDIENTE,
          canal: CanalNotificacion.PUSH,
          titulo: '🧾 Voucher pendiente de revisión',
          contenido: `Se subió un comprobante de $${montoDeclarado} MXN. Revisa y aprueba o rechaza.`,
          metadata: { pagoId: params.pagoId, monto: montoDeclarado.toString() },
        }).catch(() => {});
      }
    }).catch(() => {});

    return saved;
  }

  /**
   * Admin aprueba un voucher — marca el pago como aprobado
   */
  async aprobarVoucher(pagoId: string, adminId: string, nota?: string): Promise<Pago> {
    const pago = await this.pagoRepository.findOne({ where: { id: pagoId } });
    if (!pago) throw new NotFoundException('Pago no encontrado');

    if (pago.voucherEstatus !== 'pendiente_revision') {
      throw new BadRequestException('Este voucher ya fue procesado.');
    }

    pago.estatusPago = EstatusPago.APROBADO;
    pago.voucherEstatus = 'aprobado';
    pago.voucherNotaAdmin = nota || null;
    pago.fechaPago = new Date();
    pago.historial = [
      ...pago.historial,
      {
        accion: 'VOUCHER_APROBADO',
        fecha: new Date().toISOString(),
        usuarioId: adminId,
        detalle: `Voucher aprobado por admin. Monto confirmado: $${pago.montoDeclarado}.${nota ? ` Nota: ${nota}` : ''}`,
      },
    ];

    const saved = await this.pagoRepository.save(pago);

    // Notificar al cliente que su pago fue confirmado
    try {
      if (pago.clienteId) {
        const cliente = await this.pagoRepository.manager.query(
          `SELECT user_id FROM clientes WHERE id = $1`, [pago.clienteId]
        );
        if (cliente?.[0]?.user_id) {
          await this.notificacionesService.sendNotification({
            destinatarioId: cliente[0].user_id,
            tipo: TipoNotificacion.PAGO_CONFIRMADO,
            canal: CanalNotificacion.PUSH,
            titulo: '✅ Tu pago fue confirmado',
            contenido: `Tu transferencia de $${pago.montoDeclarado} MXN ha sido verificada y aprobada.`,
            metadata: { pagoId, monto: pago.montoDeclarado?.toString() || '' },
          }).catch(() => {});
        }
      }
    } catch {}

    return saved;
  }

  /**
   * Admin rechaza un voucher — el cliente debe volver a subir
   */
  async rechazarVoucher(pagoId: string, adminId: string, nota: string): Promise<Pago> {
    if (!nota || nota.trim() === '') {
      throw new BadRequestException('Debes indicar la razón del rechazo.');
    }

    const pago = await this.pagoRepository.findOne({ where: { id: pagoId } });
    if (!pago) throw new NotFoundException('Pago no encontrado');

    if (pago.voucherEstatus !== 'pendiente_revision') {
      throw new BadRequestException('Este voucher ya fue procesado.');
    }

    // Regresar a pendiente para que el cliente pueda reintentar
    pago.estatusPago = EstatusPago.PENDIENTE;
    pago.voucherEstatus = 'rechazado';
    pago.voucherNotaAdmin = nota.trim();
    pago.historial = [
      ...pago.historial,
      {
        accion: 'VOUCHER_RECHAZADO',
        fecha: new Date().toISOString(),
        usuarioId: adminId,
        detalle: `Voucher rechazado. Razón: ${nota}. El cliente puede subir un nuevo comprobante.`,
      },
    ];

    const saved = await this.pagoRepository.save(pago);

    // Notificar al cliente que su voucher fue rechazado
    try {
      if (pago.clienteId) {
        const cliente = await this.pagoRepository.manager.query(
          `SELECT user_id FROM clientes WHERE id = $1`, [pago.clienteId]
        );
        if (cliente?.[0]?.user_id) {
          await this.notificacionesService.sendNotification({
            destinatarioId: cliente[0].user_id,
            tipo: TipoNotificacion.PAGO_PENDIENTE,
            canal: CanalNotificacion.PUSH,
            titulo: '❌ Comprobante rechazado',
            contenido: `Tu comprobante fue rechazado: "${nota}". Por favor sube un nuevo comprobante.`,
            metadata: { pagoId, razon: nota },
          }).catch(() => {});
        }
      }
    } catch {}

    return saved;
  }

  /**
   * Admin confirma pago directo (transferencia/OXXO/crypto) en un solo paso.
   * No valida monto exacto — el admin es quien decide.
   * Registra el voucher y aprueba el pago inmediatamente.
   */
  async confirmarPagoAdmin(
    pagoId: string,
    adminId: string,
    voucherUrl: string,
    metodoPago: string,
    nota?: string,
  ): Promise<Pago> {
    const pago = await this.pagoRepository.findOne({ where: { id: pagoId } });
    if (!pago) throw new NotFoundException('Pago no encontrado');

    if (![EstatusPago.PENDIENTE, EstatusPago.EN_REVISION_VOUCHER].includes(pago.estatusPago)) {
      throw new BadRequestException('Este pago ya fue procesado.');
    }

    const metodo = metodoPago === 'crypto'
      ? MetodoPago.CRYPTO
      : MetodoPago.TRANSFERENCIA_BANCARIA;

    pago.voucherUrl = voucherUrl.trim() || 'admin-confirmado';
    pago.montoDeclarado = Number(pago.monto);
    pago.voucherEstatus = 'aprobado';
    pago.estatusPago = EstatusPago.APROBADO;
    pago.metodoPago = metodo;
    pago.fechaPago = new Date();
    pago.voucherNotaAdmin = nota || 'Confirmado por administrador';
    pago.historial = [
      ...pago.historial,
      {
        accion: 'PAGO_CONFIRMADO_ADMIN',
        fecha: new Date().toISOString(),
        usuarioId: adminId,
        detalle: `Pago confirmado directamente por administrador. Método: ${metodoPago}. Monto: $${pago.monto}.${nota ? ` Nota: ${nota}` : ''}`,
      },
    ];

    const saved = await this.pagoRepository.save(pago);

    // Notificar al cliente que su pago fue confirmado
    try {
      if (pago.clienteId) {
        const cliente = await this.pagoRepository.manager.query(
          `SELECT user_id FROM clientes WHERE id = $1`, [pago.clienteId],
        );
        if (cliente?.[0]?.user_id) {
          await this.notificacionesService.sendNotification({
            destinatarioId: cliente[0].user_id,
            tipo: TipoNotificacion.PAGO_CONFIRMADO,
            canal: CanalNotificacion.PUSH,
            titulo: '✅ Tu pago fue confirmado',
            contenido: `Tu pago de $${Number(pago.monto).toLocaleString()} MXN ha sido verificado y aprobado.`,
            metadata: { pagoId, monto: pago.monto.toString(), tramiteId: pago.tramiteId || '' },
          }).catch(() => {});
        }
      }
    } catch {}

    return saved;
  }
}
