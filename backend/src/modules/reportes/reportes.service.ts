import { Injectable } from '@nestjs/common';
import { PdfService } from './pdf.service';

@Injectable()
export class ReportesService {
  constructor(private readonly pdfService: PdfService) {}

  async generateMonthlyPdf(mes: number, anio: number, data: any): Promise<Buffer> {
    return this.pdfService.generateMonthlyReport({
      mes,
      anio,
      totalIngresos: data.totalIngresos || 0,
      totalPagos: data.totalPagos || 0,
      totalClientes: data.totalClientes || 0,
      totalTramites: data.totalTramites || 0,
      tramitesPorEstatus: data.tramitesPorEstatus || [],
      tramitesPorTipo: data.tramitesPorTipo || [],
    });
  }
}
