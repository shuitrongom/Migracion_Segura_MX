import { Controller, Get, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';

import { ReportesService } from './reportes.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Reportes')
@ApiBearerAuth()
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

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
    // Generar datos del reporte (simplificado - en producción vendría de queries reales)
    const data = {
      totalIngresos: 0,
      totalPagos: 0,
      totalClientes: 0,
      totalTramites: 0,
      tramitesPorEstatus: [],
      tramitesPorTipo: [],
    };

    const pdfBuffer = await this.reportesService.generateMonthlyPdf(mes, anio, data);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-${mes}-${anio}.pdf"`,
    });

    return new StreamableFile(pdfBuffer);
  }
}
