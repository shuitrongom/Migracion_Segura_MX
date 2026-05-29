import { Controller, Get, Query, Res, StreamableFile, Inject } from '@nestjs/common';
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
    // Obtener datos reales de la BD
    const totalClientes = await this.dataSource.query(`SELECT COUNT(*) as count FROM clientes`).then(r => parseInt(r[0]?.count || '0'));
    const totalTramites = await this.dataSource.query(`SELECT COUNT(*) as count FROM tramites`).then(r => parseInt(r[0]?.count || '0'));

    // Ingresos del mes
    const startDate = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const endDate = mes === 12 ? `${anio + 1}-01-01` : `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
    const ingresos = await this.dataSource.query(
      `SELECT COALESCE(SUM(monto), 0) as total, COUNT(*) as count FROM pagos WHERE "estatusPago" = 'aprobado' AND fecha >= $1 AND fecha < $2`,
      [startDate, endDate]
    ).then(r => ({ total: parseFloat(r[0]?.total || '0'), count: parseInt(r[0]?.count || '0') }));

    // Tramites por estatus
    const estatusData = await this.dataSource.query(
      `SELECT estatus, COUNT(*) as cantidad FROM tramites GROUP BY estatus ORDER BY cantidad DESC`
    ).then(rows => rows.map((r: any) => ({ estatus: r.estatus, cantidad: parseInt(r.cantidad) })));

    // Tramites por tipo
    const tipoData = await this.dataSource.query(
      `SELECT tipo, COUNT(*) as cantidad FROM tramites GROUP BY tipo ORDER BY cantidad DESC`
    ).then(rows => rows.map((r: any) => ({ tipo: r.tipo, cantidad: parseInt(r.cantidad) })));

    const data = {
      totalIngresos: ingresos.total,
      totalPagos: ingresos.count,
      totalClientes,
      totalTramites,
      tramitesPorEstatus: estatusData,
      tramitesPorTipo: tipoData,
    };

    const pdfBuffer = await this.reportesService.generateMonthlyPdf(mes, anio, data);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-${mes}-${anio}.pdf"`,
    });

    return new StreamableFile(pdfBuffer);
  }
}
