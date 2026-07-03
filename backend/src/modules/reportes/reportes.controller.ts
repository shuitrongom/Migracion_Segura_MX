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
    const startDate = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const endDate = mes === 12 ? `${anio + 1}-01-01` : `${anio}-${String(mes + 1).padStart(2, '0')}-01`;

    // ═══ RECOPILAR DATOS ═══
    let totalClientes = 0;
    let totalTramites = 0;
    let totalSolicitudes = 0;

    // Pagos de trámites (tabla pagos)
    let pagosAprobados: any[] = [];
    let pagosPendientes: any[] = [];

    // Solicitudes pagadas
    let solicitudesPagadas: any[] = [];
    let solicitudesActivas: any[] = [];

    // Trámites por estatus
    let tramitesPorEstatus: { estatus: string; cantidad: number }[] = [];
    let solicitudesPorEstatus: { estatus: string; cantidad: number }[] = [];

    // Clientes
    let clientesNuevos = 0;

    try {
      const r = await this.dataSource.query(`SELECT COUNT(*) as count FROM clientes`);
      totalClientes = parseInt(r?.[0]?.count || '0');
    } catch {}

    try {
      const r = await this.dataSource.query(`SELECT COUNT(*) as count FROM clientes WHERE created_at >= $1 AND created_at < $2`, [startDate, endDate]);
      clientesNuevos = parseInt(r?.[0]?.count || '0');
    } catch {}

    try {
      const r = await this.dataSource.query(`SELECT COUNT(*) as count FROM tramites`);
      totalTramites = parseInt(r?.[0]?.count || '0');
    } catch {}

    try {
      const r = await this.dataSource.query(`SELECT COUNT(*) as count FROM solicitudes`);
      totalSolicitudes = parseInt(r?.[0]?.count || '0');
    } catch {}

    // Pagos aprobados del mes (por fecha_pago)
    try {
      pagosAprobados = await this.dataSource.query(
        `SELECT id, monto, concepto, metodo_pago, fecha_pago, cliente_id, tramite_id
         FROM pagos WHERE estatus_pago = 'aprobado' AND (fecha_pago >= $1 AND fecha_pago < $2)
         ORDER BY fecha_pago ASC`,
        [startDate, endDate]
      );
    } catch {}

    // Pagos pendientes
    try {
      pagosPendientes = await this.dataSource.query(
        `SELECT id, monto, concepto, cliente_id FROM pagos WHERE estatus_pago = 'pendiente' OR estatus_pago = 'en_revision_voucher'`
      );
    } catch {}

    // Solicitudes pagadas del mes
    try {
      solicitudesPagadas = await this.dataSource.query(
        `SELECT s.id, s.costo, s."tipoTramite", s."fechaPago", s."datosFormulario"
         FROM solicitudes s WHERE s.estatus = 'pagada' AND s."fechaPago" >= $1 AND s."fechaPago" < $2
         ORDER BY s."fechaPago" ASC`,
        [startDate, endDate]
      );
    } catch {}

    // Solicitudes activas (no pagadas ni canceladas)
    try {
      solicitudesActivas = await this.dataSource.query(
        `SELECT id, estatus, "tipoTramite" FROM solicitudes WHERE estatus NOT IN ('pagada', 'cancelada')`
      );
    } catch {}

    // Trámites agrupados por estatus
    try {
      tramitesPorEstatus = await this.dataSource.query(
        `SELECT estatus, COUNT(*)::int as cantidad FROM tramites GROUP BY estatus ORDER BY cantidad DESC`
      );
    } catch {}

    // Solicitudes agrupadas por estatus
    try {
      solicitudesPorEstatus = await this.dataSource.query(
        `SELECT estatus, COUNT(*)::int as cantidad FROM solicitudes GROUP BY estatus ORDER BY cantidad DESC`
      );
    } catch {}

    // Calcular totales
    const ingresosTramites = pagosAprobados.reduce((sum, p) => sum + parseFloat(p.monto || '0'), 0);
    const ingresosSolicitudes = solicitudesPagadas.reduce((sum, s) => sum + parseFloat(s.costo || '100'), 0);
    const totalIngresos = ingresosTramites + ingresosSolicitudes;
    const totalPagos = pagosAprobados.length + solicitudesPagadas.length;
    const totalPendiente = pagosPendientes.reduce((sum, p) => sum + parseFloat(p.monto || '0'), 0);

    const data = {
      totalIngresos,
      ingresosTramites,
      ingresosSolicitudes,
      totalPagos,
      totalClientes,
      clientesNuevos,
      totalTramites,
      totalSolicitudes,
      totalPendiente,
      pagosPendientesCount: pagosPendientes.length,
      pagosAprobados,
      solicitudesPagadas,
      solicitudesActivas,
      tramitesPorEstatus,
      solicitudesPorEstatus,
    };

    const pdfBuffer = await this.reportesService.generateMonthlyPdf(mes, anio, data);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-${mes}-${anio}.pdf"`,
    });

    return new StreamableFile(pdfBuffer);
  }
}
