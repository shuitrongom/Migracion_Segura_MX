import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  /**
   * Generar reporte mensual en PDF
   */
  generateMonthlyReport(data: {
    mes: number;
    anio: number;
    totalIngresos: number;
    totalPagos: number;
    totalClientes: number;
    totalTramites: number;
    tramitesPorEstatus: { estatus: string; cantidad: number }[];
    tramitesPorTipo: { tipo: string; cantidad: number }[];
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

      // Header
      doc.fontSize(24).font('Helvetica-Bold').fillColor('#2C1810')
        .text('MIGRACION SEGURA MX', { align: 'center' });
      doc.fontSize(12).font('Helvetica').fillColor('#6B5B4F')
        .text('Reporte Mensual', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#C4A265')
        .text(`${meses[data.mes - 1]} ${data.anio}`, { align: 'center' });
      doc.moveDown(1.5);

      // Linea separadora
      doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke('#E8DFD3');
      doc.moveDown(1);

      // Resumen ejecutivo
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#2C1810')
        .text('Resumen Ejecutivo');
      doc.moveDown(0.5);

      const formatCurrency = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;

      doc.fontSize(11).font('Helvetica').fillColor('#4a4a4a');
      doc.text(`Ingresos totales: ${formatCurrency(data.totalIngresos)}`);
      doc.text(`Pagos procesados: ${data.totalPagos}`);
      doc.text(`Total clientes: ${data.totalClientes}`);
      doc.text(`Total tramites: ${data.totalTramites}`);
      doc.moveDown(1.5);

      // Tramites por estatus
      if (data.tramitesPorEstatus.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#2C1810')
          .text('Tramites por Estatus');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').fillColor('#4a4a4a');
        for (const item of data.tramitesPorEstatus) {
          doc.text(`  - ${item.estatus.replace(/_/g, ' ')}: ${item.cantidad}`);
        }
        doc.moveDown(1.5);
      }

      // Tramites por tipo
      if (data.tramitesPorTipo.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#2C1810')
          .text('Tramites por Tipo');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').fillColor('#4a4a4a');
        for (const item of data.tramitesPorTipo) {
          doc.text(`  - ${item.tipo.replace(/_/g, ' ')}: ${item.cantidad}`);
        }
        doc.moveDown(2);
      }

      // Footer
      doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke('#E8DFD3');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor('#8B7B6F')
        .text(`Generado el ${new Date().toISOString().slice(0, 10)} - Migracion Segura MX`, { align: 'center' });
      doc.text('Este documento es confidencial y de uso interno.', { align: 'center' });

      doc.end();
    });
  }
}
