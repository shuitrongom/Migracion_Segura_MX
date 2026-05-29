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
  }): Buffer {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    // Header
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#2C1810')
      .text('MIGRACIÓN SEGURA MX', { align: 'center' });
    doc.fontSize(12).font('Helvetica').fillColor('#6B5B4F')
      .text('Reporte Mensual', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#C4A265')
      .text(`${meses[data.mes - 1]} ${data.anio}`, { align: 'center' });
    doc.moveDown(1.5);

    // Línea separadora
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke('#E8DFD3');
    doc.moveDown(1);

    // Resumen ejecutivo
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2C1810')
      .text('Resumen Ejecutivo');
    doc.moveDown(0.5);

    const formatCurrency = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;

    doc.fontSize(11).font('Helvetica').fillColor('#4a4a4a');
    doc.text(`• Ingresos totales: ${formatCurrency(data.totalIngresos)}`);
    doc.text(`• Pagos procesados: ${data.totalPagos}`);
    doc.text(`• Total clientes: ${data.totalClientes}`);
    doc.text(`• Total trámites: ${data.totalTramites}`);
    doc.moveDown(1.5);

    // Trámites por estatus
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2C1810')
      .text('Trámites por Estatus');
    doc.moveDown(0.5);

    doc.fontSize(11).font('Helvetica').fillColor('#4a4a4a');
    for (const item of data.tramitesPorEstatus) {
      doc.text(`• ${item.estatus.replace(/_/g, ' ')}: ${item.cantidad}`, { indent: 20 });
    }
    doc.moveDown(1.5);

    // Trámites por tipo
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2C1810')
      .text('Trámites por Tipo');
    doc.moveDown(0.5);

    doc.fontSize(11).font('Helvetica').fillColor('#4a4a4a');
    for (const item of data.tramitesPorTipo) {
      doc.text(`• ${item.tipo.replace(/_/g, ' ')}: ${item.cantidad}`, { indent: 20 });
    }
    doc.moveDown(2);

    // Footer
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke('#E8DFD3');
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica').fillColor('#8B7B6F')
      .text(`Generado el ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })} — Migración Segura MX`, { align: 'center' });
    doc.text('Este documento es confidencial y de uso interno.', { align: 'center' });

    doc.end();

    return Buffer.concat(buffers);
  }
}
