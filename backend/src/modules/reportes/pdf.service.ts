import { Injectable } from '@nestjs/common';
const PDFDocument = require('pdfkit');

@Injectable()
export class PdfService {
  private readonly MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  generateMonthlyReport(mes: number, anio: number, data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: any) => reject(err));

      const formatCurrency = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;
      const mesNombre = this.MESES[mes - 1] || '';

      // ═══════════════════════════════════════════════════════════════════════
      // PORTADA / HEADER
      // ═══════════════════════════════════════════════════════════════════════
      doc.rect(0, 0, 612, 120).fill('#1a1a1a');
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#C4A265')
        .text('MIGRACIÓN SEGURA MX', 50, 35, { align: 'center' });
      doc.fontSize(11).font('Helvetica').fillColor('#999999')
        .text('Reporte Financiero y Operativo Mensual', 50, 70, { align: 'center' });
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff')
        .text(`${mesNombre} ${anio}`, 50, 90, { align: 'center' });

      doc.y = 140;

      // ═══════════════════════════════════════════════════════════════════════
      // RESUMEN EJECUTIVO
      // ═══════════════════════════════════════════════════════════════════════
      this.sectionTitle(doc, 'RESUMEN EJECUTIVO');

      // Tabla de métricas
      const metricsY = doc.y;
      const col1 = 50, col2 = 200, col3 = 350, col4 = 500;

      this.metricBox(doc, col1, metricsY, 'Ingresos Totales', formatCurrency(data.totalIngresos || 0), '#22c55e');
      this.metricBox(doc, col2, metricsY, 'Operaciones', String(data.totalPagos || 0), '#3b82f6');
      this.metricBox(doc, col3, metricsY, 'Por Cobrar', formatCurrency(data.totalPendiente || 0), '#f59e0b');
      this.metricBox(doc, col4, metricsY, 'Clientes', String(data.totalClientes || 0), '#8b5cf6');

      doc.y = metricsY + 55;
      doc.moveDown(1);

      // Desglose ingresos
      doc.fontSize(10).font('Helvetica').fillColor('#444444');
      doc.text(`  • Ingresos por trámites migratorios: ${formatCurrency(data.ingresosTramites || 0)} (${(data.pagosAprobados || []).length} pagos)`);
      doc.text(`  • Ingresos por solicitudes INM: ${formatCurrency(data.ingresosSolicitudes || 0)} (${(data.solicitudesPagadas || []).length} solicitudes)`);
      doc.text(`  • Pagos pendientes de cobro: ${data.pagosPendientesCount || 0} por ${formatCurrency(data.totalPendiente || 0)}`);
      doc.text(`  • Clientes nuevos este mes: ${data.clientesNuevos || 0}`);
      doc.text(`  • Total trámites activos: ${data.totalTramites || 0} | Total solicitudes: ${data.totalSolicitudes || 0}`);
      doc.moveDown(1.5);

      // ═══════════════════════════════════════════════════════════════════════
      // DETALLE DE PAGOS CONFIRMADOS
      // ═══════════════════════════════════════════════════════════════════════
      this.sectionTitle(doc, `PAGOS CONFIRMADOS — ${mesNombre.toUpperCase()} ${anio}`);

      const pagos = data.pagosAprobados || [];
      const solicitudes = data.solicitudesPagadas || [];

      if (pagos.length === 0 && solicitudes.length === 0) {
        doc.fontSize(10).font('Helvetica').fillColor('#888888')
          .text('  No hay pagos confirmados en este período.', { indent: 10 });
      } else {
        // Tabla header
        this.tableHeader(doc, ['#', 'Concepto', 'Método', 'Monto', 'Fecha']);

        let row = 1;
        // Pagos de trámites
        for (const p of pagos) {
          const concepto = (p.concepto || 'Trámite').slice(0, 35);
          const metodo = (p.metodo_pago || 'N/A').replace(/_/g, ' ');
          const monto = formatCurrency(parseFloat(p.monto) || 0);
          const fecha = p.fecha_pago ? String(p.fecha_pago).slice(0, 10) : '-';
          this.tableRow(doc, [String(row), concepto, metodo, monto, fecha], row % 2 === 0);
          row++;
          if (doc.y > 680) { doc.addPage(); doc.y = 50; }
        }

        // Solicitudes pagadas
        for (const s of solicitudes) {
          const nombre = `${s.datosFormulario?.nombre || ''} ${s.datosFormulario?.apellidos || ''}`.trim();
          const concepto = `Solicitud: ${(s.tipoTramite || '').replace(/_/g, ' ')}${nombre ? ` - ${nombre.slice(0, 20)}` : ''}`;
          const monto = formatCurrency(parseFloat(s.costo) || 100);
          const fecha = s.fechaPago ? String(s.fechaPago).slice(0, 10) : '-';
          this.tableRow(doc, [String(row), concepto.slice(0, 35), 'Manual/MP', monto, fecha], row % 2 === 0);
          row++;
          if (doc.y > 680) { doc.addPage(); doc.y = 50; }
        }

        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#22c55e')
          .text(`  TOTAL: ${formatCurrency(data.totalIngresos || 0)} — ${data.totalPagos || 0} operaciones`, { indent: 10 });
      }

      doc.moveDown(1.5);
      if (doc.y > 600) { doc.addPage(); doc.y = 50; }

      // ═══════════════════════════════════════════════════════════════════════
      // TRÁMITES POR ESTATUS
      // ═══════════════════════════════════════════════════════════════════════
      this.sectionTitle(doc, 'DISTRIBUCIÓN DE TRÁMITES');

      const tramEstatus = data.tramitesPorEstatus || [];
      const solEstatus = data.solicitudesPorEstatus || [];

      if (tramEstatus.length > 0) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333').text('  Trámites migratorios:');
        doc.fontSize(10).font('Helvetica').fillColor('#444444');
        for (const item of tramEstatus) {
          doc.text(`    • ${(item.estatus || '').replace(/_/g, ' ')}: ${item.cantidad}`);
        }
        doc.moveDown(0.5);
      }

      if (solEstatus.length > 0) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333').text('  Solicitudes INM:');
        doc.fontSize(10).font('Helvetica').fillColor('#444444');
        for (const item of solEstatus) {
          doc.text(`    • ${(item.estatus || '').replace(/_/g, ' ')}: ${item.cantidad}`);
        }
        doc.moveDown(0.5);
      }

      if (tramEstatus.length === 0 && solEstatus.length === 0) {
        doc.fontSize(10).font('Helvetica').fillColor('#888888').text('  Sin datos de distribución.');
      }

      doc.moveDown(1.5);

      // ═══════════════════════════════════════════════════════════════════════
      // SOLICITUDES ACTIVAS (pendientes)
      // ═══════════════════════════════════════════════════════════════════════
      const activas = data.solicitudesActivas || [];
      if (activas.length > 0) {
        if (doc.y > 620) { doc.addPage(); doc.y = 50; }
        this.sectionTitle(doc, 'SOLICITUDES ACTIVAS (PENDIENTES)');
        doc.fontSize(10).font('Helvetica').fillColor('#444444');
        for (const s of activas.slice(0, 20)) {
          doc.text(`  • ${(s.tipoTramite || '').replace(/_/g, ' ')} — Estatus: ${(s.estatus || '').replace(/_/g, ' ')}`);
          if (doc.y > 680) { doc.addPage(); doc.y = 50; }
        }
        if (activas.length > 20) {
          doc.text(`  ... y ${activas.length - 20} más`);
        }
        doc.moveDown(1.5);
      }

      // ═══════════════════════════════════════════════════════════════════════
      // FOOTER
      // ═══════════════════════════════════════════════════════════════════════
      const pageBottom = 720;
      if (doc.y < pageBottom - 60) {
        doc.y = pageBottom - 60;
      }
      doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke('#cccccc');
      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica').fillColor('#999999')
        .text(`Generado el ${new Date().toISOString().slice(0, 10)} a las ${new Date().toLocaleTimeString('es-MX')}`, { align: 'center' });
      doc.text('Migración Segura MX — Documento confidencial de uso interno', { align: 'center' });
      doc.text(`Período: ${mesNombre} ${anio} | Total operaciones: ${data.totalPagos || 0} | Ingresos: ${formatCurrency(data.totalIngresos || 0)}`, { align: 'center' });

      doc.end();
    });
  }

  // ═══ HELPERS ═══

  private sectionTitle(doc: any, title: string) {
    doc.moveDown(0.3);
    doc.rect(50, doc.y, 512, 22).fill('#f5f0e8');
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2C1810')
      .text(title, 58, doc.y + 6);
    doc.y += 30;
    doc.moveDown(0.3);
  }

  private metricBox(doc: any, x: number, y: number, label: string, value: string, color: string) {
    doc.rect(x, y, 130, 45).lineWidth(0.5).stroke('#dddddd');
    doc.fontSize(8).font('Helvetica').fillColor('#888888').text(label, x + 8, y + 8, { width: 114 });
    doc.fontSize(12).font('Helvetica-Bold').fillColor(color).text(value, x + 8, y + 24, { width: 114 });
  }

  private tableHeader(doc: any, headers: string[]) {
    const widths = [30, 180, 80, 100, 80];
    const startX = 55;
    let x = startX;

    doc.rect(50, doc.y - 2, 512, 18).fill('#2C1810');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
    headers.forEach((h, i) => {
      doc.text(h, x, doc.y + 3, { width: widths[i] });
      x += widths[i];
    });
    doc.y += 20;
  }

  private tableRow(doc: any, values: string[], shaded: boolean) {
    const widths = [30, 180, 80, 100, 80];
    const startX = 55;
    let x = startX;

    if (shaded) doc.rect(50, doc.y - 2, 512, 16).fill('#fafaf8');
    doc.fontSize(9).font('Helvetica').fillColor('#333333');
    values.forEach((v, i) => {
      doc.text(v, x, doc.y + 1, { width: widths[i] });
      x += widths[i];
    });
    doc.y += 16;
  }
}
