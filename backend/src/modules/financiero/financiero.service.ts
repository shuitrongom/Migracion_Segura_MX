import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';

import { Pago, EstatusPago, TipoPago } from './entities/pago.entity';
import { AcuerdoPago } from './entities/acuerdo-pago.entity';
import { MercadoPagoService } from './mercadopago.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { MetodoPago } from '../../common/enums';

@Injectable()
export class FinancieroService {
  constructor(
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(AcuerdoPago)
    private readonly acuerdoPagoRepository: Repository<AcuerdoPago>,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  /**
   * Generar pagos divididos (anticipo 50% + liquidación 50%)
   * Crea los dos registros y genera el link de Mercado Pago para el anticipo
   */
  async generarPagosDivididos(params: {
    tramiteId: string;
    clienteId: string;
    montoTotal: number;
    concepto: string;
    clienteNombre: string;
    email: string;
    registradoPor: string;
  }): Promise<{ anticipo: Pago; liquidacion: Pago }> {
    const montoAnticipo = Math.round(params.montoTotal * 50) / 100; // 50%
    const montoLiquidacion = params.montoTotal - montoAnticipo;
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 15); // 15 días para pagar

    // Crear link de Mercado Pago para el anticipo
    const mpPreference = await this.mercadoPagoService.createPreference({
      tramiteId: params.tramiteId,
      concepto: `Anticipo (50%) - ${params.concepto}`,
      monto: montoAnticipo,
      clienteNombre: params.clienteNombre,
      email: params.email,
    });

    // Crear registro de anticipo
    const anticipo = this.pagoRepository.create({
      clienteId: params.clienteId,
      tramiteId: params.tramiteId,
      montoTotalTramite: params.montoTotal,
      monto: montoAnticipo,
      fecha: new Date(),
      tipoPago: TipoPago.ANTICIPO,
      estatusPago: EstatusPago.PENDIENTE,
      concepto: `Anticipo (50%) - ${params.concepto}`,
      mercadopagoPreferenceId: mpPreference.preferenceId,
      mercadopagoInitPoint: mpPreference.initPoint || mpPreference.sandboxInitPoint,
      fechaVencimiento,
      registradoPor: params.registradoPor,
      historial: [{
        accion: 'CREADO',
        fecha: new Date().toISOString(),
        usuarioId: params.registradoPor,
        detalle: `Anticipo generado por $${montoAnticipo} MXN. Vence: ${fechaVencimiento.toISOString().slice(0, 10)}`,
      }],
    });
    const savedAnticipo = await this.pagoRepository.save(anticipo);

    // Crear registro de liquidación (pendiente, sin link aún)
    const liquidacion = this.pagoRepository.create({
      clienteId: params.clienteId,
      tramiteId: params.tramiteId,
      montoTotalTramite: params.montoTotal,
      monto: montoLiquidacion,
      fecha: new Date(),
      tipoPago: TipoPago.LIQUIDACION,
      estatusPago: EstatusPago.PENDIENTE,
      concepto: `Liquidación (50%) - ${params.concepto}`,
      fechaVencimiento: null, // Se activa cuando el trámite se resuelve
      registradoPor: params.registradoPor,
      historial: [{
        accion: 'CREADO',
        fecha: new Date().toISOString(),
        usuarioId: params.registradoPor,
        detalle: `Liquidación programada por $${montoLiquidacion} MXN. Se activará al resolver el trámite.`,
      }],
    });
    const savedLiquidacion = await this.pagoRepository.save(liquidacion);

    return { anticipo: savedAnticipo, liquidacion: savedLiquidacion };
  }

  /**
   * Generar link de pago para la liquidación (cuando el trámite se resuelve)
   */
  async generarLinkLiquidacion(params: {
    tramiteId: string;
    clienteNombre: string;
    email: string;
    registradoPor: string;
  }): Promise<Pago> {
    const liquidacion = await this.pagoRepository.findOne({
      where: { tramiteId: params.tramiteId, tipoPago: TipoPago.LIQUIDACION, estatusPago: EstatusPago.PENDIENTE },
    });

    if (!liquidacion) {
      throw new NotFoundException('No se encontró liquidación pendiente para este trámite');
    }

    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 15);

    const mpPreference = await this.mercadoPagoService.createPreference({
      tramiteId: params.tramiteId,
      concepto: liquidacion.concepto,
      monto: Number(liquidacion.monto),
      clienteNombre: params.clienteNombre,
      email: params.email,
    });

    liquidacion.mercadopagoPreferenceId = mpPreference.preferenceId || null;
    liquidacion.mercadopagoInitPoint = mpPreference.initPoint || mpPreference.sandboxInitPoint || null;
    liquidacion.fechaVencimiento = fechaVencimiento;
    liquidacion.historial = [
      ...liquidacion.historial,
      {
        accion: 'LINK_GENERADO',
        fecha: new Date().toISOString(),
        usuarioId: params.registradoPor,
        detalle: `Link de pago generado. Vence: ${fechaVencimiento.toISOString().slice(0, 10)}`,
      },
    ];

    return this.pagoRepository.save(liquidacion);
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

    if (!pago) return;

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
    const totalPendiente = pagos.filter(p => p.estatusPago === EstatusPago.PENDIENTE).reduce((sum, p) => sum + Number(p.monto), 0);
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
}
