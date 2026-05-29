import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';

import { NotificacionesService } from './notificaciones.service';
import { PushService } from './push.service';
import { EmailService } from '../email/email.service';
import { CanalNotificacion, TipoNotificacion } from '../../common/enums';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly notificacionesService: NotificacionesService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Recordatorio de citas — se ejecuta todos los días a las 9:00 AM
   * Notifica a extranjeros que tienen cita en 2 días
   */
  @Cron('0 9 * * *', { name: 'recordatorio-citas', timeZone: 'America/Mexico_City' })
  async enviarRecordatoriosCitas() {
    this.logger.log('Ejecutando: Recordatorio de citas (2 días antes)');

    try {
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      const targetDate = twoDaysFromNow.toISOString().split('T')[0];

      const citas = await this.notificacionesService['notificacionRepository'].manager.query(
        `SELECT c.id, c.tipo, c.fecha, c.hora, c.modalidad, c."clienteId",
                cl."userId", cl."nombreCompleto", cl.email
         FROM citas c
         JOIN clientes cl ON cl.id = c."clienteId"
         WHERE c.fecha = $1 AND c.estatus = 'programada'`,
        [targetDate],
      );

      for (const cita of citas) {
        // Push notification
        if (cita.userId) {
          await this.notificacionesService.sendNotification({
            destinatarioId: cita.userId,
            tipo: TipoNotificacion.CITA_PROXIMA,
            canal: CanalNotificacion.PUSH,
            titulo: '📅 Recordatorio: Cita en 2 días',
            contenido: `Tienes una ${cita.tipo === 'inm' ? 'cita en el INM' : 'entrevista'} el ${cita.fecha} a las ${cita.hora}`,
            metadata: { citaId: cita.id },
          }).catch(() => {});
        }

        // Email
        if (cita.email) {
          await this.emailService.sendCitaReminderEmail({
            to: cita.email,
            nombreExtranjero: cita.nombreCompleto || 'Estimado/a',
            tipoCita: cita.tipo,
            fecha: cita.fecha,
            hora: cita.hora,
            modalidad: cita.modalidad,
          }).catch(() => {});
        }
      }

      this.logger.log(`Recordatorios enviados: ${citas.length} citas`);
    } catch (error: any) {
      this.logger.error(`Error en recordatorio de citas: ${error.message}`);
    }
  }

  /**
   * Cancelar pagos vencidos — se ejecuta todos los días a las 8:00 AM
   * Cancela pagos que llevan más de 15 días sin pagarse
   */
  @Cron('0 8 * * *', { name: 'cancelar-pagos-vencidos', timeZone: 'America/Mexico_City' })
  async cancelarPagosVencidos() {
    this.logger.log('Ejecutando: Cancelar pagos vencidos');

    try {
      const ahora = new Date();
      const vencidos = await this.notificacionesService['notificacionRepository'].manager.query(
        `UPDATE pagos SET "estatusPago" = 'cancelado',
         historial = historial || $1::jsonb
         WHERE "estatusPago" = 'pendiente' AND "fechaVencimiento" < $2
         RETURNING id, "clienteId", "tramiteId", monto`,
        [
          JSON.stringify([{ accion: 'CANCELADO_POR_VENCIMIENTO', fecha: ahora.toISOString(), usuarioId: 'sistema', detalle: 'Pago cancelado automáticamente por no pagarse en 15 días.' }]),
          ahora.toISOString(),
        ],
      );

      // Notificar a cada extranjero que su pago fue cancelado
      for (const pago of vencidos || []) {
        if (pago.clienteId) {
          try {
            const cliente = await this.notificacionesService['notificacionRepository'].manager.query(
              `SELECT "userId" FROM clientes WHERE id = $1`, [pago.clienteId]
            );
            if (cliente?.[0]?.userId) {
              await this.notificacionesService.sendNotification({
                destinatarioId: cliente[0].userId,
                tipo: TipoNotificacion.PAGO_PENDIENTE,
                canal: CanalNotificacion.PUSH,
                titulo: '⚠️ Pago cancelado por vencimiento',
                contenido: `Tu pago de $${pago.monto} MXN fue cancelado por no realizarse en 15 días. Contacta a tu gestor.`,
                metadata: { tramiteId: pago.tramiteId },
              }).catch(() => {});
            }
          } catch {}
        }
      }

      this.logger.log(`Pagos cancelados por vencimiento: ${vencidos?.length || 0}`);
    } catch (error: any) {
      this.logger.error(`Error cancelando pagos: ${error.message}`);
    }
  }

  /**
   * Recordatorio de pago pendiente — se ejecuta todos los días a las 10:00 AM
   * Notifica 3 días antes del vencimiento
   */
  @Cron('0 10 * * *', { name: 'recordatorio-pagos', timeZone: 'America/Mexico_City' })
  async enviarRecordatoriosPago() {
    this.logger.log('Ejecutando: Recordatorio de pagos por vencer');

    try {
      const tresDias = new Date();
      tresDias.setDate(tresDias.getDate() + 3);
      const targetDate = tresDias.toISOString().split('T')[0];

      const pagos = await this.notificacionesService['notificacionRepository'].manager.query(
        `SELECT p.id, p.monto, p."clienteId", p."tramiteId", p."fechaVencimiento",
                cl."userId", cl.email, cl."nombreCompleto"
         FROM pagos p
         JOIN clientes cl ON cl.id = p."clienteId"
         WHERE p."estatusPago" = 'pendiente'
         AND p."fechaVencimiento"::date = $1::date`,
        [targetDate],
      );

      for (const pago of pagos) {
        if (pago.userId) {
          await this.notificacionesService.sendNotification({
            destinatarioId: pago.userId,
            tipo: TipoNotificacion.PAGO_PENDIENTE,
            canal: CanalNotificacion.PUSH,
            titulo: '⏰ Pago por vencer en 3 días',
            contenido: `Tu pago de $${pago.monto} MXN vence en 3 días. Realiza el pago para evitar la cancelación de tu trámite.`,
            metadata: { tramiteId: pago.tramiteId },
          }).catch(() => {});
        }
      }

      this.logger.log(`Recordatorios de pago enviados: ${pagos.length}`);
    } catch (error: any) {
      this.logger.error(`Error en recordatorio de pagos: ${error.message}`);
    }
  }

  /**
   * Alerta de documentos por vencer — se ejecuta cada lunes a las 9:00 AM
   * Notifica cuando un pasaporte/documento vence en 30 días
   */
  @Cron('0 9 * * 1', { name: 'documentos-por-vencer', timeZone: 'America/Mexico_City' })
  async alertaDocumentosPorVencer() {
    this.logger.log('Ejecutando: Alerta de documentos por vencer');

    try {
      const treintaDias = new Date();
      treintaDias.setDate(treintaDias.getDate() + 30);

      const docs = await this.notificacionesService['notificacionRepository'].manager.query(
        `SELECT d.id, d.nombre, d."fechaVencimiento", e."clienteId",
                cl."userId", cl."nombreCompleto"
         FROM documentos d
         JOIN expedientes e ON e.id = d."expedienteId"
         JOIN clientes cl ON cl.id = e."clienteId"
         WHERE d."fechaVencimiento" IS NOT NULL
         AND d."fechaVencimiento" <= $1
         AND d."fechaVencimiento" > NOW()
         AND d.estatus != 'rechazado'`,
        [treintaDias.toISOString()],
      );

      for (const doc of docs) {
        if (doc.userId) {
          await this.notificacionesService.sendNotification({
            destinatarioId: doc.userId,
            tipo: TipoNotificacion.DOCUMENTO_POR_VENCER,
            canal: CanalNotificacion.PUSH,
            titulo: '📄 Documento por vencer',
            contenido: `Tu documento "${doc.nombre}" vence pronto. Renuévalo para evitar problemas con tu trámite.`,
            metadata: { documentoId: doc.id },
          }).catch(() => {});
        }
      }

      // Notificar al admin también
      if (docs.length > 0) {
        const admins = await this.notificacionesService['notificacionRepository'].manager.query(
          `SELECT id FROM users WHERE role = 'administrador' AND "deletedAt" IS NULL LIMIT 1`
        );
        if (admins?.[0]?.id) {
          await this.notificacionesService.sendNotification({
            destinatarioId: admins[0].id,
            tipo: TipoNotificacion.DOCUMENTO_POR_VENCER,
            canal: CanalNotificacion.PUSH,
            titulo: `📄 ${docs.length} documento(s) por vencer`,
            contenido: `Hay ${docs.length} documentos de extranjeros que vencen en los próximos 30 días.`,
            metadata: { cantidad: docs.length.toString() },
          }).catch(() => {});
        }
      }

      this.logger.log(`Alertas de documentos por vencer: ${docs.length}`);
    } catch (error: any) {
      this.logger.error(`Error en alerta de documentos: ${error.message}`);
    }
  }

  /**
   * Seguimiento de inactividad — se ejecuta cada lunes a las 8:00 AM
   * Notifica al admin si un trámite lleva más de 30 días sin movimiento
   */
  @Cron('0 8 * * 1', { name: 'seguimiento-inactividad', timeZone: 'America/Mexico_City' })
  async seguimientoInactividad() {
    this.logger.log('Ejecutando: Seguimiento de inactividad');

    try {
      const treintaDias = new Date();
      treintaDias.setDate(treintaDias.getDate() - 30);

      const inactivos = await this.notificacionesService['notificacionRepository'].manager.query(
        `SELECT t.id, t.tipo, t."numeroPieza", t."updatedAt", t."clienteId",
                cl."nombreCompleto"
         FROM tramites t
         LEFT JOIN clientes cl ON cl.id = t."clienteId"
         WHERE t.estatus NOT IN ('aprobado', 'rechazado', 'cancelado')
         AND t."updatedAt" < $1`,
        [treintaDias.toISOString()],
      );

      if (inactivos.length > 0) {
        const admins = await this.notificacionesService['notificacionRepository'].manager.query(
          `SELECT id FROM users WHERE role = 'administrador' AND "deletedAt" IS NULL LIMIT 1`
        );
        if (admins?.[0]?.id) {
          await this.notificacionesService.sendNotification({
            destinatarioId: admins[0].id,
            tipo: TipoNotificacion.SEGUIMIENTO_INACTIVIDAD,
            canal: CanalNotificacion.PUSH,
            titulo: `⚠️ ${inactivos.length} trámite(s) inactivos`,
            contenido: `Hay ${inactivos.length} trámites sin movimiento en más de 30 días. Revisa el panel para dar seguimiento.`,
            metadata: { cantidad: inactivos.length.toString() },
          }).catch(() => {});
        }
      }

      this.logger.log(`Trámites inactivos detectados: ${inactivos.length}`);
    } catch (error: any) {
      this.logger.error(`Error en seguimiento de inactividad: ${error.message}`);
    }
  }
}
