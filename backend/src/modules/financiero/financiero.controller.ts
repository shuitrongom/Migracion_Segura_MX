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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

import { FinancieroService } from './financiero.service';
import { MercadoPagoService } from './mercadopago.service';
import { SolicitudesService } from '../solicitudes/solicitudes.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Financiero')
@ApiBearerAuth()
@Controller('financiero')
export class FinancieroController {
  constructor(
    private readonly financieroService: FinancieroService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly solicitudesService: SolicitudesService,
  ) {}

  /**
   * Req 13.1 - Register payment
   */
  @Post('pagos')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Registrar pago manual' })
  registrarPago(
    @Body() dto: CreatePagoDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.financieroService.registrarPago(dto, req.user.id);
  }

  /**
   * Generar pagos divididos (anticipo 50% + liquidación 50%)
   */
  @Post('pagos/generar-dividido')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Generar pagos divididos (anticipo + liquidación) con link de Mercado Pago' })
  generarPagosDivididos(
    @Body() body: { tramiteId: string; clienteId: string; montoTotal: number; concepto: string; clienteNombre: string; email: string },
    @Request() req: { user: { id: string } },
  ) {
    return this.financieroService.generarPagosDivididos({ ...body, registradoPor: req.user.id });
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
          // Confirmar pago de solicitud
          try { await this.solicitudesService.confirmarPago(refId, payment.id?.toString()); } catch {}

        } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
          try {
            await this.financieroService.notificarPagoRechazado(refId, payment.status);
          } catch {}
        }
      } catch {}
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
        return { ok: false, message: 'No hay link de pago pendiente para este trámite' };
      }

      // Buscar userId del cliente
      const userId = await this.financieroService.getUserIdByTramiteOrSolicitud(body.tramiteId);
      if (!userId) {
        return { ok: false, message: 'No se encontró el usuario del extranjero' };
      }

      // Enviar push
      const { NotificacionesService } = await import('../notificaciones/notificaciones.service');
      const notifService = this.financieroService['notificacionesService'];
      await notifService.sendNotification({
        destinatarioId: userId,
        tipo: 'pago_pendiente',
        canal: 'push',
        titulo: '💰 Recordatorio: Tienes un pago pendiente',
        contenido: `Pago de $${Number(pago.monto).toLocaleString()} MXN pendiente. Toca para pagar.`,
        metadata: { tramiteId: body.tramiteId, initPoint: pago.mercadopagoInitPoint, monto: pago.monto.toString() },
      });

      return { ok: true, message: 'Link reenviado al extranjero' };
    } catch {
      return { ok: false, message: 'Error al reenviar' };
    }
  }
}
