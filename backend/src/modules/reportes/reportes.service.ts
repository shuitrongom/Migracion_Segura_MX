import { Injectable } from '@nestjs/common';
import { PdfService } from './pdf.service';

@Injectable()
export class ReportesService {
  constructor(private readonly pdfService: PdfService) {}

  async generateMonthlyPdf(mes: number, anio: number, data: any): Promise<Buffer> {
    return this.pdfService.generateMonthlyReport(mes, anio, data);
  }
}
