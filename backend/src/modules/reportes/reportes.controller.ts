import { Controller, Get, Query, Res, StreamableFile, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { DataSource } from 'typeorm';

import { ReportesService } from './reportes.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Reportes')
@ApiBearerAuth()
@Controller('reportes')
export class ReportesController {
  private readonly logger = new Logger(ReportesController.name);

  constructor(
    private readonly reportesService: ReportesService,
    private readonly dataSource: DataSource,
  ) {}

  @Get('pdf/mensual')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Descargar reporte mensual en PDF' })
  @ApiQuery({ name: 'mes', type: Number })
  @ApiQuery({ name: 'anio', type: Number })
  async downloadMonthlyPdf(
    @Query('mes') mes: number,
    @Query('anio') anio: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    let totalClientes = 0;
    let totalTramites = 0;
    let totalIngresos = 0;
    let totalPagos = 0;
    let tramitesPorEstatus: { estatus: string; cantidad: number }[] = [];
    let tramitesPorTipo: { tipo: string; cantidad: number }[] = [];

    try {
      const clientesResult = await this.dataSource.query(`SELECT COUNT(*) as count FROM clientes`);
      totalClientes = parseInt(clientesResult?.[0]?.count || '0');
    } catch (e) { this.logger.warn('Error contando clientes: ' + e.message); }

    try {
      const tramitesResult = await this.dataSource.query(`SELECT COUNT(*) as count FROM tramites`);
      totalTramites = parseInt(tramitesResult?.[0]?.count || '0');
    } catch (e) { this.logger.warn('Error contando tramites: ' + e.message); }

    try {
      const startDate = `${anio}-${String(mes).padStart(2, '0')}-01`;
      const endDate = mes === 12 ? `${anio + 1}-01-01` : `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
      const ingresosResult = await this.dataSource.query(
        `SELECT COALESCE(SUM(monto), 0) as total, COUNT(*) as count FROM pagos WHERE estatus_pago = 'aprobado' AND created_at >= $1 AND created_at < $2`,
        [startDate, endDate]
      );
      totalIngresos = parseFloat(ingresosResult?.[0]?.total || '0');
      totalPagos = parseInt(ingresosResult?.[0]?.count || '0');
    } catch (e) { this.logger.warn('Error calculando ingresos: ' + e.message); }

    try {
      const estatusResult = await this.dataSource.query(
        `SELECT estatus, COUNT(*)::int as cantidad FROM tramites GROUP BY estatus ORDER BY cantidad DESC`
      );
      tramitesPorEstatus = estatusResult || [];
    } catch (e) { this.logger.warn('Error agrupando por estatus: ' + e.message); }

    try {
      const tipoResult = await this.dataSource.query(
        `SELECT tipo, COUNT(*)::int as cantidad FROM tramites GROUP BY tipo ORDER BY cantidad DESC`
      );
      tramitesPorTipo = tipoResult || [];
    } catch (e) { this.logger.warn('Error agrupando por tipo: ' + e.message); }

    const data = { totalIngresos, totalPagos, totalClientes, totalTramites, tramitesPorEstatus, tramitesPorTipo };

    const pdfBuffer = await this.reportesService.generateMonthlyPdf(mes, anio, data);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-${mes}-${anio}.pdf"`,
    });

    return new StreamableFile(pdfBuffer);
  }
}
