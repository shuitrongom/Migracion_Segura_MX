import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Pago } from './entities/pago.entity';
import { AcuerdoPago } from './entities/acuerdo-pago.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class FinancieroService {
  constructor(
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(AcuerdoPago)
    private readonly acuerdoPagoRepository: Repository<AcuerdoPago>,
  ) {}

  /**
   * Req 13.1 - Register payment.
   */
  async registrarPago(dto: CreatePagoDto, registradoPor: string): Promise<Pago> {
    const pago = this.pagoRepository.create({
      clienteId: dto.clienteId,
      tramiteId: dto.tramiteId ?? null,
      monto: dto.monto,
      fecha: dto.fecha as unknown as Date,
      metodoPago: dto.metodoPago,
      concepto: dto.concepto,
      registradoPor,
    });

    return this.pagoRepository.save(pago);
  }

  /**
   * Req 13.3 - Get pending balance for a client.
   * Calculates: total agreed amount - total paid amount.
   */
  async getSaldoPendiente(clienteId: string): Promise<{
    montoTotal: number;
    montoPagado: number;
    saldoPendiente: number;
  }> {
    // Sum of all payment agreements for the client
    const acuerdoResult = await this.acuerdoPagoRepository
      .createQueryBuilder('acuerdo')
      .select('COALESCE(SUM(acuerdo.montoTotal), 0)', 'total')
      .where('acuerdo.clienteId = :clienteId', { clienteId })
      .getRawOne();

    // Sum of all payments made by the client
    const pagoResult = await this.pagoRepository
      .createQueryBuilder('pago')
      .select('COALESCE(SUM(pago.monto), 0)', 'total')
      .where('pago.clienteId = :clienteId', { clienteId })
      .getRawOne();

    const montoTotal = parseFloat(acuerdoResult?.total ?? '0');
    const montoPagado = parseFloat(pagoResult?.total ?? '0');

    return {
      montoTotal,
      montoPagado,
      saldoPendiente: montoTotal - montoPagado,
    };
  }

  /**
   * Req 13.6 - Payment history for a client.
   */
  async getHistorialByCliente(
    clienteId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponseDto<Pago>> {
    const [data, total] = await this.pagoRepository.findAndCount({
      where: { clienteId },
      order: { fecha: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }

  /**
   * Req 13.7 - Monthly income report grouped by tipo (concepto) and metodo.
   */
  async getReporteMensual(
    mes: number,
    anio: number,
  ): Promise<{
    mes: number;
    anio: number;
    totalIngresos: number;
    porMetodo: Array<{ metodoPago: string; total: number; cantidad: number }>;
    porConcepto: Array<{ concepto: string; total: number; cantidad: number }>;
  }> {
    // Filter payments by month and year
    const startDate = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const endDate =
      mes === 12
        ? `${anio + 1}-01-01`
        : `${anio}-${String(mes + 1).padStart(2, '0')}-01`;

    const porMetodo = await this.pagoRepository
      .createQueryBuilder('pago')
      .select('pago.metodoPago', 'metodoPago')
      .addSelect('COALESCE(SUM(pago.monto), 0)', 'total')
      .addSelect('COUNT(pago.id)', 'cantidad')
      .where('pago.fecha >= :startDate AND pago.fecha < :endDate', {
        startDate,
        endDate,
      })
      .groupBy('pago.metodoPago')
      .getRawMany();

    const porConcepto = await this.pagoRepository
      .createQueryBuilder('pago')
      .select('pago.concepto', 'concepto')
      .addSelect('COALESCE(SUM(pago.monto), 0)', 'total')
      .addSelect('COUNT(pago.id)', 'cantidad')
      .where('pago.fecha >= :startDate AND pago.fecha < :endDate', {
        startDate,
        endDate,
      })
      .groupBy('pago.concepto')
      .getRawMany();

    const totalIngresos = porMetodo.reduce(
      (sum, item) => sum + parseFloat(item.total),
      0,
    );

    return {
      mes,
      anio,
      totalIngresos,
      porMetodo: porMetodo.map((item) => ({
        metodoPago: item.metodoPago,
        total: parseFloat(item.total),
        cantidad: parseInt(item.cantidad, 10),
      })),
      porConcepto: porConcepto.map((item) => ({
        concepto: item.concepto,
        total: parseFloat(item.total),
        cantidad: parseInt(item.cantidad, 10),
      })),
    };
  }
}
