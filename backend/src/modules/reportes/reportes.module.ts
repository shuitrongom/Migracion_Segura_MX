import { Module } from '@nestjs/common';

import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { PdfService } from './pdf.service';

@Module({
  controllers: [ReportesController],
  providers: [ReportesService, PdfService],
  exports: [ReportesService, PdfService],
})
export class ReportesModule {}
