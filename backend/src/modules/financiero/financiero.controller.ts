import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

import { FinancieroService } from './financiero.service';
import { MercadoPagoService } from './mercadopago.service';
import { SolicitudesService } from '../solicitudes/solicitudes.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole, TipoNotificacion, CanalNotificacion } from '../../common/enums';

@ApiTags('Financiero')
@ApiBearerAuth()
@Controller('financiero')
export class FinancieroController {
  private readonly logger = new Logger(FinancieroController.name);

  constructor(
    private readonly financieroService: FinancieroService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly solicitudesService: SolicitudesService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * DESHABILITADO: El admin NO puede registrar pagos manuales.
   * Los pagos solo se registran via Mercado Pago (webhook) o transferencia con voucher verificado.
   * El admin solo puede: asignar monto al generar pagos divididos y aprobar/rechazar vouchers.
   */

  /**
   * Generar pagos divididos (anticipo 50% + liquidación 50%)
   * ÚNICA operación donde el admin define el monto — al momento de asignar costo al trámite.
   */
  @Post('pagos/generar-dividido')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Generar pagos divididos (1 a 4 parcialidades) con link de Mercado Pago' })
  generarPagosDivididos(
    @Body() body: { tramiteId: string; clienteId: string; montoTotal: number; concepto: string; clienteNombre: string; email: string; numeroPagos?: number },
    @Request() req: { user: { id: string } },
  ) {
    return this.financieroService.generarPagosDivididos({ ...body, numeroPagos: body.numeroPagos || 2, registradoPor: req.user.id });
  }

  /**
   * Generar link de liquidación (cuando el trámite se resuelve)
   */
  @Post('pagos/generar-liquidacion')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Generar link de pago para la liquidación' })
  generarLinkLiquidacion(
    @Body() body: { tramiteId: string; clienteNombre: string; email: string },
    @Request() req: { user: { id: string } },
  ) {
    return this.financieroService.generarLinkLiquidacion({ ...body, registradoPor: req.user.id });
  }

  /**
   * Obtener pagos de un trámite
   */
  @Get('pagos/tramite/:tramiteId')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR, UserRole.CLIENTE)
  @ApiOperation({ summary: 'Obtener pagos de un trámite' })
  getPagosByTramite(@Param('tramiteId', ParseUUIDPipe) tramiteId: string) {
    return this.financieroService.getPagosByTramite(tramiteId);
  }

  /**
   * Req 13.6 - Payment history for a client
   */
  @Get('pagos/cliente/:clienteId')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Historial de pagos de un cliente' })
  @ApiParam({ name: 'clienteId', description: 'UUID del cliente' })
  getHistorialByCliente(
    @Param('clienteId', ParseUUIDPipe) clienteId: string,
    @Query() pagination: PaginationDto,
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    return this.financieroService.getHistorialByCliente(clienteId, page, limit);
  }

  /**
   * Req 13.3 - Pending balance for a client
   */
  @Get('saldo/:clienteId')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Obtener saldo pendiente de un cliente' })
  @ApiParam({ name: 'clienteId', description: 'UUID del cliente' })
  getSaldoPendiente(@Param('clienteId', ParseUUIDPipe) clienteId: string) {
    return this.financieroService.getSaldoPendiente(clienteId);
  }

  /**
   * Req 13.7 - Monthly income report
   */
  @Get('reporte-mensual')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Reporte mensual de ingresos' })
  @ApiQuery({ name: 'mes', description: 'Mes (1-12)', example: 6 })
  @ApiQuery({ name: 'anio', description: 'Año', example: 2024 })
  getReporteMensual(
    @Query('mes', ParseIntPipe) mes: number,
    @Query('anio', ParseIntPipe) anio: number,
  ) {
    return this.financieroService.getReporteMensual(mes, anio);
  }

  /**
   * Crear preferencia de pago en Mercado Pago
   */
  @Post('mercadopago/crear-preferencia')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR, UserRole.CLIENTE)
  @ApiOperation({ summary: 'Crear link de pago con Mercado Pago' })
  async crearPreferencia(
    @Body() body: { tramiteId: string; concepto: string; monto: number; clienteNombre: string; email: string },
  ) {
    return this.mercadoPagoService.createPreference({
      tramiteId: body.tramiteId,
      concepto: body.concepto,
      monto: body.monto,
      clienteNombre: body.clienteNombre,
      email: body.email,
    });
  }

  /**
   * Webhook de Mercado Pago (notificación de pago)
   */
  @Post('webhook/mercadopago')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook de notificación de Mercado Pago' })
  async webhookMercadoPago(@Body() body: any) {
    if (body.type === 'payment' && body.data?.id) {
      try {
        const payment = await this.mercadoPagoService.getPayment(body.data.id.toString());
        const refId = payment.externalReference;
        if (!refId) return { received: true };

        if (payment.status === 'approved') {
          // Confirmar pago de trámite
          await this.financieroService.procesarPagoAprobado(
            payment.id?.toString() || '',
            refId,
            payment.amount || 0,
            payment.paymentMethod || '',
          );
          // Confirmar pago de solicitud (puede no ser solicitud, OK si falla)
          try { await this.solicitudesService.confirmarPago(refId, payment.id?.toString()); } catch {}

        } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
          try {
            await this.financieroService.notificarPagoRechazado(refId, payment.status);
          } catch (e: any) {
            this.logger.error(`Error notificando pago rechazado ${refId}: ${e.message}`);
          }
        }
      } catch (e: any) {
        this.logger.error(`Error procesando webhook MP payment_id=${body.data?.id}: ${e.message}`, e.stack);
      }
    }
    return { received: true };
  }

  /**
   * Reenviar link de pago al extranjero vía push notification
   */
  @Post('pagos/reenviar-link')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Reenviar link de pago al extranjero' })
  async reenviarLinkPago(@Body() body: { tramiteId: string; pagoId?: string }) {
    try {
      // Buscar el pago pendiente con link
      const pagos = await this.financieroService.getPagosByTramite(body.tramiteId);
      const pago = body.pagoId
        ? pagos.find(p => p.id === body.pagoId)
        : pagos.find(p => (p.estatusPago === 'pendiente') && p.mercadopagoInitPoint);

      if (!pago || !pago.mercadopagoInitPoint) {
        // Si no hay link MP, el extranjero puede pagar por transferencia
        if (!pago) return { ok: false, message: 'No hay pago pendiente para este trámite' };
      }

      // Buscar userId y datos del cliente
      const userId = await this.financieroService.getUserIdByTramiteOrSolicitud(body.tramiteId);
      if (!userId) {
        return { ok: false, message: 'No se encontró el usuario del extranjero' };
      }

      // Obtener datos del extranjero para email y WhatsApp
      const clienteData = await this.financieroService['pagoRepository'].manager.query(
        `SELECT c.email, c.telefono, c.nombre_completo, u.full_name FROM clientes c LEFT JOIN users u ON u.id = c.user_id WHERE c.user_id = $1 OR c.id = $1 LIMIT 1`,
        [userId]
      ).catch(() => []);
      const clienteEmail = clienteData?.[0]?.email;
      const clienteTelefono = clienteData?.[0]?.telefono;
      const clienteNombre = clienteData?.[0]?.nombre_completo || clienteData?.[0]?.full_name || 'Extranjero';

      // 1. Enviar push notification
      const notifService = this.financieroService['notificacionesService'];
      await notifService.sendNotification({
        destinatarioId: userId,
        tipo: TipoNotificacion.PAGO_PENDIENTE,
        canal: CanalNotificacion.PUSH,
        titulo: '💰 Recordatorio: Tienes un pago pendiente',
        contenido: pago.mercadopagoInitPoint
          ? `Pago de $${Number(pago.monto).toLocaleString()} MXN pendiente. Toca para pagar.`
          : `Pago de $${Number(pago.monto).toLocaleString()} MXN pendiente. Paga por transferencia desde la app.`,
        metadata: { tramiteId: body.tramiteId, initPoint: pago.mercadopagoInitPoint || '', monto: pago.monto.toString() },
      }).catch(() => {});

      // 2. Enviar email con link de pago
      if (clienteEmail) {
        const emailService = this.financieroService['emailService'];
        try {
          await emailService.sendAdminNotificationEmail({
            subject: `Recordatorio de pago: $${Number(pago.monto).toLocaleString()} MXN`,
            event: '💰 Tienes un pago pendiente',
            details: `Hola ${clienteNombre}, tu pago de $${Number(pago.monto).toLocaleString()} MXN está pendiente. ${pago.mercadopagoInitPoint ? 'Usa el link de pago o paga por transferencia desde la app.' : 'Paga por transferencia desde la app Migración Segura MX.'}`,
            extraInfo: pago.mercadopagoInitPoint || undefined,
          });
        } catch {}
      }

      // 3. Registrar intento de WhatsApp (para que el admin copie y envíe)
      const whatsappLink = clienteTelefono
        ? `https://wa.me/${clienteTelefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${clienteNombre}, tienes un pago pendiente de $${Number(pago.monto).toLocaleString()} MXN para tu trámite migratorio. ${pago.mercadopagoInitPoint ? 'Link de pago: ' + pago.mercadopagoInitPoint : 'Paga por transferencia desde la app Migración Segura MX.'}`)}`
        : null;

      return {
        ok: true,
        message: 'Link reenviado por push' + (clienteEmail ? ' + email' : '') + (whatsappLink ? ' (WhatsApp disponible)' : ''),
        whatsappLink,
      };
    } catch {
      return { ok: false, message: 'Error al reenviar' };
    }
  }

  /**
   * Cliente sube voucher/comprobante de transferencia
   * Requiere: pagoId, montoDeclarado, voucherUrl (ya subido a storage)
   */
  @Post('pagos/:pagoId/voucher')
  @Roles(UserRole.CLIENTE, UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Registrar pago por transferencia con voucher' })
  @ApiParam({ name: 'pagoId', description: 'UUID del pago' })
  async subirVoucher(
    @Param('pagoId', ParseUUIDPipe) pagoId: string,
    @Body() body: { montoDeclarado: number; voucherUrl: string; metodoPago: string },
    @Request() req: { user: { id: string } },
  ) {
    return this.financieroService.registrarVoucher({
      pagoId,
      montoDeclarado: Number(body.montoDeclarado), // Asegurar número
      voucherUrl: String(body.voucherUrl || ''),
      metodoPago: String(body.metodoPago || 'transferencia_bancaria'),
      userId: req.user.id,
    });
  }

  /**
   * Admin aprueba un voucher
   */
  @Post('pagos/:pagoId/voucher/aprobar')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Aprobar voucher de transferencia' })
  @ApiParam({ name: 'pagoId', description: 'UUID del pago' })
  async aprobarVoucher(
    @Param('pagoId', ParseUUIDPipe) pagoId: string,
    @Body() body: { nota?: string },
    @Request() req: { user: { id: string } },
  ) {
    return this.financieroService.aprobarVoucher(pagoId, req.user.id, body.nota);
  }

  /**
   * Admin rechaza un voucher
   */
  @Post('pagos/:pagoId/voucher/rechazar')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Rechazar voucher de transferencia' })
  @ApiParam({ name: 'pagoId', description: 'UUID del pago' })
  async rechazarVoucher(
    @Param('pagoId', ParseUUIDPipe) pagoId: string,
    @Body() body: { nota: string },
    @Request() req: { user: { id: string } },
  ) {
    return this.financieroService.rechazarVoucher(pagoId, req.user.id, body.nota);
  }

  /**
   * Admin confirma pago de transferencia/OXXO directamente (sin validación de monto exacto).
   * Usado cuando el admin registra el pago manualmente con comprobante.
   * Hace todo en un solo paso: registra el voucher y lo aprueba inmediatamente.
   */
  @Post('pagos/:pagoId/confirmar-pago-admin')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Admin confirma pago por transferencia/OXXO directamente' })
  @ApiParam({ name: 'pagoId', description: 'UUID del pago' })
  async confirmarPagoAdmin(
    @Param('pagoId', ParseUUIDPipe) pagoId: string,
    @Body() body: { voucherUrl: string; metodoPago: string; nota?: string },
    @Request() req: { user: { id: string } },
  ) {
    return this.financieroService.confirmarPagoAdmin(pagoId, req.user.id, body.voucherUrl, body.metodoPago, body.nota);
  }

  /**
   * Obtener datos bancarios para transferencia
   */
  @Get('datos-bancarios')
  @Roles(UserRole.CLIENTE, UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Obtener datos bancarios para pago por transferencia' })
  getDatosBancarios() {
    const titular = this.configService.get<string>('DATOS_BANCARIOS_TITULAR', '');
    const cuentasRaw = this.configService.get<string>('DATOS_BANCARIOS_CUENTAS', '[]');
    const cryptoRaw = this.configService.get<string>('DATOS_BANCARIOS_CRYPTO', '[]');

    let cuentas = [];
    let crypto = [];
    try { cuentas = JSON.parse(cuentasRaw); } catch { cuentas = []; }
    try { crypto = JSON.parse(cryptoRaw); } catch { crypto = []; }

    return { titular, cuentas, crypto };
  }
}
