import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey || '');
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'sistema@migracionseguramx.com';
    this.fromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'Migración Segura MX';
  }

  // ─── Shared Template Builder ───────────────────────────────────────────────────

  /**
   * Template base para emails al CLIENTE (tema claro, warm & profesional)
   */
  private buildClientTemplate(params: { title: string; body: string; footerText?: string }): string {
    const { title, body, footerText } = params;
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f8f4ee;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;padding:48px 20px;">
    <tr><td>
      <!-- Header con logo y gradiente -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#2C1810 0%,#4A2C1A 100%);border-radius:16px 16px 0 0;padding:36px 32px;">
        <tr><td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0"><tr>
            <td style="width:40px;height:40px;background:#C4A265;border-radius:10px;text-align:center;vertical-align:middle;">
              <span style="color:#2C1810;font-size:18px;font-weight:800;">M</span>
            </td>
            <td style="padding-left:12px;">
              <h1 style="color:#C4A265;margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px;">MIGRACIÓN SEGURA MX</h1>
            </td>
          </tr></table>
          <p style="color:#d4c5b0;margin:8px 0 0;font-size:13px;letter-spacing:0.3px;">Tu trámite migratorio en buenas manos</p>
        </td></tr>
      </table>

      <!-- Cuerpo del email -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#ffffff;padding:40px 36px;border-left:1px solid #e8dfd3;border-right:1px solid #e8dfd3;">
        <tr><td>
          ${body}
        </td></tr>
      </table>

      <!-- Footer -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#faf7f2;border-radius:0 0 16px 16px;padding:24px 32px;border:1px solid #e8dfd3;border-top:none;">
        <tr><td align="center">
          ${footerText ? `<p style="color:#6B5B4F;font-size:12px;margin:0 0 8px;">${footerText}</p>` : ''}
          <p style="color:#9a8e84;font-size:11px;margin:0;">© ${new Date().getFullYear()} Migración Segura MX · Todos los derechos reservados</p>
          <p style="color:#bbb;font-size:10px;margin:6px 0 0;">Este es un correo automático. Por favor no respondas a este mensaje.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  /**
   * Template base para emails al ADMIN (tema oscuro, moderno & premium)
   * Usa colores hex sólidos para compatibilidad con Outlook/Gmail/Apple Mail
   */
  private buildAdminTemplate(params: { title: string; body: string }): string {
    const { title, body } = params;
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;padding:48px 20px;">
    <tr><td>
      <!-- Header -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#222222;border-radius:16px 16px 0 0;padding:36px 32px;border:1px solid #444444;border-bottom:none;">
        <tr><td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0"><tr>
            <td style="width:44px;height:44px;background-color:#f59e0b;border-radius:12px;text-align:center;vertical-align:middle;">
              <span style="color:#ffffff;font-size:20px;font-weight:800;">M</span>
            </td>
            <td style="padding-left:14px;">
              <h1 style="color:#f59e0b;margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px;">MIGRACIÓN SEGURA MX</h1>
              <p style="color:#999999;margin:2px 0 0;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Panel de Administración</p>
            </td>
          </tr></table>
        </td></tr>
      </table>

      <!-- Cuerpo del email -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#2a2a2a;padding:40px 36px;border-left:1px solid #444444;border-right:1px solid #444444;">
        <tr><td>
          ${body}
        </td></tr>
      </table>

      <!-- Footer -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#222222;border-radius:0 0 16px 16px;padding:24px 32px;border:1px solid #444444;border-top:none;">
        <tr><td align="center">
          <p style="color:#888888;font-size:11px;margin:0;">© ${new Date().getFullYear()} Migración Segura MX · admin.migracionseguramx.com</p>
          <p style="color:#666666;font-size:10px;margin:6px 0 0;">Notificación automática del sistema</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  // ─── Email Methods ─────────────────────────────────────────────────────────────

  /**
   * Enviar código de verificación por email
   */
  async sendVerificationCodeEmail(params: { to: string; code: string }): Promise<void> {
    const { to, code } = params;

    const body = `
      <h2 style="color:#2C1810;margin:0 0 8px;font-size:22px;font-weight:700;">Verifica tu cuenta</h2>
      <p style="color:#6B5B4F;font-size:14px;margin:0 0 28px;line-height:1.6;">Ingresa el siguiente código en la app para verificar tu identidad:</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
        <tr><td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#fef9f0,#fdf2e0);border:2px solid #C4A265;border-radius:16px;padding:28px 48px;">
            <tr><td align="center">
              <p style="color:#6B5B4F;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:600;margin:0 0 8px;">Tu código</p>
              <span style="font-size:38px;font-weight:800;color:#2C1810;letter-spacing:10px;font-family:'Courier New',monospace;">${code}</span>
            </td></tr>
          </table>
        </td></tr>
      </table>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fef9f0;border-radius:12px;padding:16px 20px;margin:0 0 20px;">
        <tr><td>
          <p style="color:#92700c;font-size:13px;margin:0;line-height:1.5;">⏱️ Este código expira en <strong>15 minutos</strong>. Si no lo solicitaste, ignora este correo.</p>
        </td></tr>
      </table>
    `;

    try {
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject: `Tu código de verificación: ${code} — Migración Segura MX`,
        html: this.buildClientTemplate({ title: 'Código de Verificación', body }),
      });
      this.logger.log(`Código de verificación enviado a ${to}`);
    } catch (error) {
      this.logger.error(`Error enviando código a ${to}:`, error);
    }
  }

  /**
   * Enviar email de recuperación de contraseña
   */
  async sendPasswordResetEmail(params: { to: string; resetUrl: string }): Promise<void> {
    const { to, resetUrl } = params;

    const body = `
      <h2 style="color:#2C1810;margin:0 0 8px;font-size:22px;font-weight:700;">Recuperar contraseña</h2>
      <p style="color:#6B5B4F;font-size:14px;margin:0 0 28px;line-height:1.6;">Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para crear una nueva:</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
        <tr><td align="center">
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#2C1810,#4A2C1A);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:15px;font-weight:600;box-shadow:0 4px 12px rgba(44,24,16,0.3);">🔑 Restablecer contraseña</a>
        </td></tr>
      </table>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fef9f0;border-radius:12px;padding:16px 20px;margin:0 0 20px;">
        <tr><td>
          <p style="color:#92700c;font-size:13px;margin:0;line-height:1.5;">⏱️ Este enlace expira en <strong>30 minutos</strong>. Si no solicitaste este cambio, ignora este correo.</p>
        </td></tr>
      </table>
    `;

    try {
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject: 'Recuperar contraseña — Migración Segura MX',
        html: this.buildClientTemplate({ title: 'Recuperar Contraseña', body }),
      });
      this.logger.log(`Email de reset enviado a ${to}`);
    } catch (error) {
      this.logger.error(`Error enviando reset a ${to}:`, error);
    }
  }

  /**
   * Enviar email de bienvenida al nuevo asesor con sus credenciales
   */
  async sendAsesorWelcomeEmail(params: {
    to: string;
    fullName: string;
    password: string;
    loginUrl: string;
  }): Promise<void> {
    const { to, fullName, password, loginUrl } = params;

    const body = `
      <h2 style="color:#2C1810;margin:0 0 8px;font-size:22px;font-weight:700;">¡Bienvenido/a, ${fullName}!</h2>
      <p style="color:#6B5B4F;font-size:14px;margin:0 0 28px;line-height:1.6;">Se te ha dado acceso como <strong>Asesor</strong> en la plataforma. A continuación tus credenciales:</p>

      <!-- Credentials Card -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#fef9f0,#fdf2e0);border:1px solid #e8dfd3;border-radius:16px;padding:28px;margin:0 0 28px;">
        <tr><td>
          <p style="color:#6B5B4F;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin:0 0 6px;">📧 Correo electrónico</p>
          <p style="color:#2C1810;font-size:16px;margin:0 0 20px;font-weight:600;">${to}</p>
          <p style="color:#6B5B4F;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin:0 0 6px;">🔐 Contraseña temporal</p>
          <p style="color:#2C1810;font-size:18px;margin:0;font-weight:700;font-family:'Courier New',monospace;background:#fff;padding:12px 16px;border-radius:8px;border:1px solid #e8dfd3;">${password}</p>
        </td></tr>
      </table>

      <!-- CTA -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
        <tr><td align="center">
          <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#2C1810,#4A2C1A);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:15px;font-weight:600;box-shadow:0 4px 12px rgba(44,24,16,0.3);">Iniciar Sesión →</a>
        </td></tr>
      </table>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fef9f0;border-radius:12px;padding:16px 20px;">
        <tr><td>
          <p style="color:#92700c;font-size:13px;margin:0;line-height:1.5;">⚠️ Te recomendamos cambiar tu contraseña después del primer inicio de sesión.</p>
        </td></tr>
      </table>
    `;

    try {
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject: 'Bienvenido al equipo — Tus credenciales de acceso',
        html: this.buildClientTemplate({ title: 'Bienvenido', body }),
      });
      this.logger.log(`Email de bienvenida enviado a ${to}`);
    } catch (error) {
      this.logger.error(`Error enviando email a ${to}:`, error);
    }
  }

  /**
   * Enviar lista de requisitos al extranjero
   */
  async sendRequisitosEmail(params: {
    to: string;
    nombreExtranjero: string;
    requisitos: string[];
  }): Promise<void> {
    const { to, nombreExtranjero, requisitos } = params;

    const requisitosHtml = requisitos.map((r, i) =>
      `<tr><td style="padding:14px 16px;border-bottom:1px solid #f0ebe3;font-size:14px;color:#2C1810;line-height:1.5;">
        <span style="display:inline-block;width:24px;height:24px;background:#C4A265;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:10px;">${i + 1}</span>
        ${r}
      </td></tr>`
    ).join('');

    const body = `
      <h2 style="color:#2C1810;margin:0 0 8px;font-size:22px;font-weight:700;">Requisitos de tu trámite</h2>
      <p style="color:#6B5B4F;font-size:14px;margin:0 0 8px;line-height:1.6;">Hola <strong>${nombreExtranjero}</strong>,</p>
      <p style="color:#6B5B4F;font-size:14px;margin:0 0 28px;line-height:1.6;">Para continuar con tu trámite migratorio, necesitas reunir los siguientes documentos:</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e8dfd3;border-radius:12px;overflow:hidden;margin:0 0 28px;">
        <tr><td style="background:linear-gradient(135deg,#2C1810,#4A2C1A);padding:14px 16px;">
          <p style="font-size:12px;font-weight:600;color:#C4A265;text-transform:uppercase;letter-spacing:1.5px;margin:0;">📋 Documentos requeridos</p>
        </td></tr>
        ${requisitosHtml}
      </table>

      <p style="color:#6B5B4F;font-size:14px;line-height:1.6;margin:0 0 8px;">Una vez que tengas todo listo, puedes subirlos directamente en la app o entregarlos a tu gestor.</p>
    `;

    try {
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject: 'Requisitos para tu trámite migratorio — Migración Segura MX',
        html: this.buildClientTemplate({ title: 'Requisitos', body, footerText: 'Si tienes dudas, contacta a tu gestor asignado.' }),
      });
      this.logger.log(`Requisitos enviados a ${to}`);
    } catch (error) {
      this.logger.error(`Error enviando requisitos a ${to}:`, error);
    }
  }

  /**
   * Enviar recordatorio de cita al extranjero
   */
  async sendCitaReminderEmail(params: {
    to: string;
    nombreExtranjero: string;
    tipoCita: string;
    fecha: string;
    hora: string;
    modalidad: string;
  }): Promise<void> {
    const { to, nombreExtranjero, tipoCita, fecha, hora, modalidad } = params;
    const tipoLabel = tipoCita === 'inm' ? 'Cita en el INM' : 'Entrevista con tu Gestor';
    const modalidadLabel = modalidad === 'videollamada' ? '💻 Videollamada' : '🏢 Presencial';
    const tipoIcon = tipoCita === 'inm' ? '🏛️' : '👤';

    const body = `
      <h2 style="color:#2C1810;margin:0 0 8px;font-size:22px;font-weight:700;">Recordatorio de Cita</h2>
      <p style="color:#6B5B4F;font-size:14px;margin:0 0 28px;line-height:1.6;">Hola <strong>${nombreExtranjero}</strong>, te recordamos que tienes una cita en <strong style="color:#C4A265;">2 días</strong>:</p>

      <!-- Appointment Card -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#fef9f0,#fdf2e0);border:1px solid #e8dfd3;border-radius:16px;padding:28px;margin:0 0 28px;">
        <tr><td>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding-bottom:16px;border-bottom:1px solid #e8dfd3;">
                <p style="color:#6B5B4F;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin:0 0 4px;">Tipo de cita</p>
                <p style="color:#2C1810;font-size:17px;font-weight:600;margin:0;">${tipoIcon} ${tipoLabel}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 0;border-bottom:1px solid #e8dfd3;">
                <p style="color:#6B5B4F;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin:0 0 4px;">Fecha y hora</p>
                <p style="color:#2C1810;font-size:17px;font-weight:600;margin:0;">📅 ${fecha} · ⏰ ${hora}</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top:16px;">
                <p style="color:#6B5B4F;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin:0 0 4px;">Modalidad</p>
                <p style="color:#2C1810;font-size:17px;font-weight:600;margin:0;">${modalidadLabel}</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fef9f0;border-radius:12px;padding:16px 20px;">
        <tr><td>
          <p style="color:#92700c;font-size:13px;margin:0;line-height:1.5;">📄 Asegúrate de tener tus documentos listos. Si necesitas reagendar, contacta a tu gestor.</p>
        </td></tr>
      </table>
    `;

    try {
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject: `Recordatorio: ${tipoLabel} el ${fecha} — Migración Segura MX`,
        html: this.buildClientTemplate({ title: 'Recordatorio de Cita', body }),
      });
      this.logger.log(`Recordatorio de cita enviado a ${to}`);
    } catch (error) {
      this.logger.error(`Error enviando recordatorio a ${to}:`, error);
    }
  }

  /**
   * Notificar al admin por email de eventos importantes
   * Envía al correo configurado en ADMIN_NOTIFICATION_EMAIL (o admin@migracionseguramx.com por defecto)
   */
  async sendAdminNotificationEmail(params: {
    subject: string;
    event: string;
    details: string;
    extraInfo?: string;
  }): Promise<void> {
    const adminEmail = this.configService.get<string>('ADMIN_NOTIFICATION_EMAIL') || 'admin@migracionseguramx.com';
    const { subject, event, details, extraInfo } = params;

    const body = `
      <!-- Event badge -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
        <tr><td>
          <span style="display:inline-block;background-color:#f59e0b;color:#ffffff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;padding:6px 14px;border-radius:20px;">Notificación</span>
        </td></tr>
      </table>

      <h2 style="color:#ffffff;margin:0 0 12px;font-size:22px;font-weight:700;line-height:1.3;">${event}</h2>
      <p style="color:#cccccc;font-size:15px;margin:0 0 28px;line-height:1.7;">${details}</p>

      ${extraInfo ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#333333;border:1px solid #555555;border-radius:12px;padding:20px;margin:0 0 28px;">
        <tr><td>
          <p style="color:#eeeeee;font-size:13px;margin:0;line-height:1.6;font-family:'Courier New',monospace;">${extraInfo}</p>
        </td></tr>
      </table>` : ''}

      <!-- CTA -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;">
        <tr><td align="center">
          <a href="https://admin.migracionseguramx.com" style="display:inline-block;background-color:#f59e0b;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:14px;font-weight:600;">Abrir Panel de Admin →</a>
        </td></tr>
      </table>
    `;

    try {
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: adminEmail,
        subject: `[Admin] ${subject}`,
        html: this.buildAdminTemplate({ title: subject, body }),
      });
      this.logger.log(`Notificación admin enviada: ${subject}`);
    } catch (error) {
      this.logger.error(`Error enviando notificación admin:`, error);
    }
  }
}
