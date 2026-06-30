import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { NotificacionesService } from './notificaciones.service';
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
   * Recordatorio de citas — todos los días a las 9:00 AM
   */
  @Cron('0 9 * * *', { name: 'recordatorio-citas', timeZone: 'America/Mexico_City' })
  async enviarRecordatoriosCitas() {
    this.logger.log('Ejecutando: Recordatorio de citas');
    try {
      const twoDays = new Date();
      twoDays.setDate(twoDays.getDate() + 2);
      const targetDate = twoDays.toISOString().split('T')[0];

      const citas = await this.notificacionesService['notificacionRepository'].manager.query(
        `SELECT c.id, c.tipo, c.fecha, c.hora, c.modalidad, c.cliente_id,
                cl.user_id, cl.nombre_completo, cl.email
         FROM citas c
         JOIN clientes cl ON cl.id = c.cliente_id
         WHERE c.fecha = $1 AND c.estatus = 'programada'`,
        [targetDate],
      );

      for (const cita of citas) {
        if (cita.user_id) {
          await this.notificacionesService.sendNotification({
            destinatarioId: cita.user_id,
            tipo: TipoNotificacion.CITA_PROXIMA,
            canal: CanalNotificacion.PUSH,
            titulo: 'Recordatorio: Cita en 2 dias',
            contenido: `Tienes una ${cita.tipo === 'inm' ? 'cita en el INM' : 'entrevista'} el ${cita.fecha} a las ${cita.hora}`,
            metadata: { citaId: cita.id },
          }).catch(() => {});
        }
        if (cita.email) {
          await this.emailService.sendCitaReminderEmail({
            to: cita.email,
            nombreExtranjero: cita.nombre_completo || 'Estimado/a',
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
   * Cancelar pagos vencidos — todos los días a las 8:00 AM
   */
  @Cron('0 8 * * *', { name: 'cancelar-pagos-vencidos', timeZone: 'America/Mexico_City' })
  async cancelarPagosVencidos() {
    this.logger.log('Ejecutando: Cancelar pagos vencidos');
    try {
      const ahora = new Date();
      const vencidos = await this.notificacionesService['notificacionRepository'].manager.query(
        `UPDATE pagos SET estatus_pago = 'cancelado'
         WHERE estatus_pago = 'pendiente' AND fecha_vencimiento < $1
         RETURNING id, cliente_id, tramite_id, monto`,
        [ahora.toISOString()],
      );

      for (const pago of vencidos || []) {
        if (pago.cliente_id) {
          try {
            const cliente = await this.notificacionesService['notificacionRepository'].manager.query(
              `SELECT user_id FROM clientes WHERE id = $1`, [pago.cliente_id]
            );
            if (cliente?.[0]?.user_id) {
              await this.notificacionesService.sendNotification({
                destinatarioId: cliente[0].user_id,
                tipo: TipoNotificacion.PAGO_PENDIENTE,
                canal: CanalNotificacion.PUSH,
                titulo: 'Pago cancelado por vencimiento',
                contenido: `Tu pago de $${pago.monto} MXN fue cancelado por no realizarse en 15 dias.`,
                metadata: { tramiteId: pago.tramite_id },
              }).catch(() => {});
            }
          } catch {}
        }
      }
      this.logger.log(`Pagos cancelados: ${vencidos?.length || 0}`);
    } catch (error: any) {
      this.logger.error(`Error cancelando pagos: ${error.message}`);
    }
  }

  /**
   * Recordatorio de pago pendiente — todos los días a las 10:00 AM
   */
  @Cron('0 10 * * *', { name: 'recordatorio-pagos', timeZone: 'America/Mexico_City' })
  async enviarRecordatoriosPago() {
    this.logger.log('Ejecutando: Recordatorio de pagos por vencer');
    try {
      const tresDias = new Date();
      tresDias.setDate(tresDias.getDate() + 3);
      const targetDate = tresDias.toISOString().split('T')[0];

      const pagos = await this.notificacionesService['notificacionRepository'].manager.query(
        `SELECT p.id, p.monto, p.cliente_id, p.tramite_id,
                cl.user_id, cl.email
         FROM pagos p
         JOIN clientes cl ON cl.id = p.cliente_id
         WHERE p.estatus_pago = 'pendiente'
         AND p.fecha_vencimiento::date = $1::date`,
        [targetDate],
      );

      for (const pago of pagos) {
        if (pago.user_id) {
          await this.notificacionesService.sendNotification({
            destinatarioId: pago.user_id,
            tipo: TipoNotificacion.PAGO_PENDIENTE,
            canal: CanalNotificacion.PUSH,
            titulo: 'Pago por vencer en 3 dias',
            contenido: `Tu pago de $${pago.monto} MXN vence en 3 dias. Realiza el pago para evitar la cancelacion.`,
            metadata: { tramiteId: pago.tramite_id },
          }).catch(() => {});
        }
      }
      this.logger.log(`Recordatorios de pago enviados: ${pagos.length}`);
    } catch (error: any) {
      this.logger.error(`Error en recordatorio de pagos: ${error.message}`);
    }
  }

  /**
   * Alerta de documentos por vencer — todos los días a las 9:00 AM
   */
  @Cron('0 9 * * *', { name: 'documentos-por-vencer', timeZone: 'America/Mexico_City' })
  async alertaDocumentosPorVencer() {
    this.logger.log('Ejecutando: Alerta de documentos por vencer');
    try {
      const treintaDias = new Date();
      treintaDias.setDate(treintaDias.getDate() + 30);

      const docs = await this.notificacionesService['notificacionRepository'].manager.query(
        `SELECT d.id, d.nombre, d.fecha_vencimiento, d.tramite_id, e.cliente_id, cl.user_id
         FROM documentos d
         JOIN expedientes e ON e.id = d.expediente_id
         JOIN clientes cl ON cl.id = e.cliente_id
         WHERE d.fecha_vencimiento IS NOT NULL
         AND d.fecha_vencimiento <= $1
         AND d.fecha_vencimiento > NOW()
         AND d.estatus != 'rechazado'`,
        [treintaDias.toISOString()],
      );

      for (const doc of docs) {
        if (doc.user_id) {
          const diasRestantes = Math.ceil((new Date(doc.fecha_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          await this.notificacionesService.sendNotification({
            destinatarioId: doc.user_id,
            tipo: TipoNotificacion.DOCUMENTO_POR_VENCER,
            canal: CanalNotificacion.PUSH,
            titulo: '⚠️ Documento por vencer',
            contenido: `Tu documento "${doc.nombre}" vence en ${diasRestantes} días. Renuévalo para evitar problemas migratorios.`,
            metadata: { documentoId: doc.id, tramiteId: doc.tramite_id },
          }).catch(() => {});
        }
      }
      this.logger.log(`Alertas de documentos: ${docs.length}`);
    } catch (error: any) {
      this.logger.error(`Error en alerta de documentos: ${error.message}`);
    }
  }

  /**
   * Seguimiento de inactividad — cada lunes a las 8:00 AM
   */
  @Cron('0 8 * * 1', { name: 'seguimiento-inactividad', timeZone: 'America/Mexico_City' })
  async seguimientoInactividad() {
    this.logger.log('Ejecutando: Seguimiento de inactividad');
    try {
      const treintaDias = new Date();
      treintaDias.setDate(treintaDias.getDate() - 30);

      const inactivos = await this.notificacionesService['notificacionRepository'].manager.query(
        `SELECT COUNT(*) as cantidad FROM tramites
         WHERE estatus NOT IN ('aprobado', 'rechazado', 'cancelado')
         AND updated_at < $1`,
        [treintaDias.toISOString()],
      );

      const cantidad = parseInt(inactivos?.[0]?.cantidad || '0');
      if (cantidad > 0) {
        const admins = await this.notificacionesService['notificacionRepository'].manager.query(
          `SELECT id FROM users WHERE role = 'administrador' AND deleted_at IS NULL LIMIT 1`
        );
        if (admins?.[0]?.id) {
          await this.notificacionesService.sendNotification({
            destinatarioId: admins[0].id,
            tipo: TipoNotificacion.SEGUIMIENTO_INACTIVIDAD,
            canal: CanalNotificacion.PUSH,
            titulo: `${cantidad} tramite(s) inactivos`,
            contenido: `Hay ${cantidad} tramites sin movimiento en mas de 30 dias.`,
            metadata: { cantidad: cantidad.toString() },
          }).catch(() => {});
        }
      }
      this.logger.log(`Tramites inactivos: ${cantidad}`);
    } catch (error: any) {
      this.logger.error(`Error en seguimiento: ${error.message}`);
    }
  }
}
