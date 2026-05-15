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
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'noreply@migracion-segura.mx';
    this.fromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'Migración Segura MX';
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

    try {
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject: 'Bienvenido al equipo — Tus credenciales de acceso',
        html: this.buildAsesorWelcomeHtml({ fullName, email: to, password, loginUrl }),
      });
      this.logger.log(`Email de bienvenida enviado a ${to}`);
    } catch (error) {
      this.logger.error(`Error enviando email a ${to}:`, error);
      // No lanzamos error para no bloquear la creación del asesor
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

    const requisitosHtml = requisitos.map((r, i) => `<tr><td style="padding: 8px 12px; border-bottom: 1px solid #e8dfd3; font-size: 14px; color: #2C1810;"><strong>${i + 1}.</strong> ${r}</td></tr>`).join('');

    try {
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject: 'Requisitos para tu trámite migratorio — Migración Segura MX',
        html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f5f0e8;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
<tr><td>
<table role="presentation" width="100%" style="background-color:#2C1810;border-radius:12px 12px 0 0;padding:24px;"><tr><td align="center"><h1 style="color:#C4A265;margin:0;font-size:20px;">MIGRACIÓN SEGURA MX</h1></td></tr></table>
<table role="presentation" width="100%" style="background-color:#fff;padding:32px;">
<tr><td>
<h2 style="color:#2C1810;margin:0 0 16px;font-size:18px;">Hola ${nombreExtranjero},</h2>
<p style="color:#4a4a4a;font-size:14px;line-height:1.6;">Para continuar con tu trámite migratorio, necesitas reunir los siguientes documentos:</p>
<table role="presentation" width="100%" style="margin:20px 0;border:1px solid #e8dfd3;border-radius:8px;overflow:hidden;">
<tr><td style="background:#f8f5f0;padding:10px 12px;font-size:12px;font-weight:600;color:#6B5B4F;text-transform:uppercase;">Documentos requeridos</td></tr>
${requisitosHtml}
</table>
<p style="color:#4a4a4a;font-size:14px;line-height:1.6;">Una vez que tengas todos los documentos listos, puedes entregarlos a tu gestor o subirlos directamente en la plataforma.</p>
<p style="color:#888;font-size:12px;margin-top:20px;">Si tienes dudas, contacta a tu gestor asignado.</p>
</td></tr></table>
<table role="presentation" width="100%" style="background-color:#f8f5f0;border-radius:0 0 12px 12px;padding:20px;"><tr><td align="center"><p style="color:#6B5B4F;font-size:11px;margin:0;">© ${new Date().getFullYear()} Migración Segura MX</p></td></tr></table>
</td></tr></table>
</body></html>`,
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
    const modalidadLabel = modalidad === 'videollamada' ? 'Videollamada' : 'Presencial';

    try {
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject: `Recordatorio: ${tipoLabel} el ${fecha} — Migración Segura MX`,
        html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;font-family:-apple-system,sans-serif;background:#f5f0e8;"><table width="100%" style="max-width:600px;margin:0 auto;padding:40px 20px;"><tr><td><table width="100%" style="background:#2C1810;border-radius:12px 12px 0 0;padding:24px;"><tr><td align="center"><h1 style="color:#C4A265;margin:0;font-size:20px;">MIGRACIÓN SEGURA MX</h1></td></tr></table><table width="100%" style="background:#fff;padding:32px;"><tr><td><h2 style="color:#2C1810;font-size:18px;">Recordatorio de Cita</h2><p style="color:#4a4a4a;font-size:14px;">Hola ${nombreExtranjero}, te recordamos que tienes una cita en <strong>2 días</strong>:</p><table width="100%" style="margin:20px 0;background:#f8f5f0;border:1px solid #e8dfd3;border-radius:8px;padding:20px;"><tr><td><p style="font-size:12px;color:#6B5B4F;text-transform:uppercase;font-weight:600;margin:0 0 4px;">Tipo</p><p style="font-size:16px;color:#2C1810;margin:0 0 12px;">${tipoLabel}</p><p style="font-size:12px;color:#6B5B4F;text-transform:uppercase;font-weight:600;margin:0 0 4px;">Fecha y hora</p><p style="font-size:16px;color:#2C1810;margin:0 0 12px;">${fecha} a las ${hora}</p><p style="font-size:12px;color:#6B5B4F;text-transform:uppercase;font-weight:600;margin:0 0 4px;">Modalidad</p><p style="font-size:16px;color:#2C1810;margin:0;">${modalidadLabel}</p></td></tr></table><p style="color:#4a4a4a;font-size:14px;">Asegúrate de tener tus documentos listos. Si necesitas reagendar, contacta a tu gestor.</p></td></tr></table><table width="100%" style="background:#f8f5f0;border-radius:0 0 12px 12px;padding:20px;"><tr><td align="center"><p style="color:#6B5B4F;font-size:11px;margin:0;">© ${new Date().getFullYear()} Migración Segura MX</p></td></tr></table></td></tr></table></body></html>`,
      });
      this.logger.log(`Recordatorio de cita enviado a ${to}`);
    } catch (error) {
      this.logger.error(`Error enviando recordatorio a ${to}:`, error);
    }
  }

  private buildAsesorWelcomeHtml(params: {
    fullName: string;
    email: string;
    password: string;
    loginUrl: string;
  }): string {
    const { fullName, email, password, loginUrl } = params;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f0e8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #2C1810; border-radius: 12px 12px 0 0; padding: 32px;">
          <tr>
            <td align="center">
              <h1 style="color: #C4A265; margin: 0; font-size: 24px; font-weight: 700;">MIGRACIÓN SEGURA MX</h1>
              <p style="color: #d4c5b0; margin: 8px 0 0; font-size: 14px;">Panel de Gestión</p>
            </td>
          </tr>
        </table>

        <!-- Body -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; padding: 40px 32px;">
          <tr>
            <td>
              <h2 style="color: #2C1810; margin: 0 0 16px; font-size: 20px;">¡Bienvenido/a, ${fullName}!</h2>
              <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                Se te ha dado acceso como <strong>Asesor</strong> en la plataforma de Migración Segura MX. A continuación encontrarás tus credenciales de acceso:
              </p>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f5f0; border: 1px solid #e8dfd3; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="color: #6B5B4F; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px; font-weight: 600;">Correo electrónico</p>
                    <p style="color: #2C1810; font-size: 16px; margin: 0 0 16px; font-weight: 500;">${email}</p>
                    <p style="color: #6B5B4F; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px; font-weight: 600;">Contraseña temporal</p>
                    <p style="color: #2C1810; font-size: 16px; margin: 0; font-weight: 500; font-family: monospace; background: #fff; padding: 8px 12px; border-radius: 4px; border: 1px solid #e8dfd3;">${password}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; background-color: #2C1810; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">Iniciar Sesión</a>
                  </td>
                </tr>
              </table>

              <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
                <strong>Importante:</strong> Te recomendamos cambiar tu contraseña después del primer inicio de sesión.
              </p>
              <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 0;">
                Si no solicitaste esta cuenta, puedes ignorar este correo.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f5f0; border-radius: 0 0 12px 12px; padding: 24px 32px;">
          <tr>
            <td align="center">
              <p style="color: #6B5B4F; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Migración Segura MX. Todos los derechos reservados.
              </p>
              <p style="color: #999; font-size: 11px; margin: 8px 0 0;">
                Este es un correo automático, por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
