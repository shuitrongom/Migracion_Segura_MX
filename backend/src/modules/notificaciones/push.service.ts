import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('Firebase no configurado - push notifications deshabilitadas');
      return;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      this.initialized = true;
      this.logger.log('Firebase Admin SDK inicializado correctamente');
    } catch (error) {
      this.logger.error('Error inicializando Firebase:', error);
    }
  }

  /**
   * Enviar push notification a un token específico (Expo Push Token o FCM)
   */
  async sendPush(params: {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<boolean> {
    const { token, title, body, data } = params;

    // Si es un Expo Push Token, usar Expo Push API (NO requiere Firebase)
    if (token.startsWith('ExponentPushToken') || token.startsWith('ExpoPushToken')) {
      return this.sendExpoPush({ token, title, body, data });
    }

    // Si es un FCM token, necesita Firebase inicializado
    if (!this.initialized) {
      this.logger.warn('Firebase no inicializado, no se puede enviar push FCM');
      return false;
    }

    // Enviar via Firebase Cloud Messaging
    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            color: '#f59e0b',
            sound: 'default',
          },
        },
      });
      this.logger.log(`FCM push enviado a ${token.slice(0, 20)}...`);
      return true;
    } catch (error: any) {
      this.logger.error(`Error enviando FCM push: ${error.message}`);
      return false;
    }
  }

  /**
   * Enviar via Expo Push API (para tokens ExponentPushToken)
   * Funciona independientemente de Firebase — usa el servicio de Expo directamente
   */
  private async sendExpoPush(params: {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<boolean> {
    const { token, title, body, data } = params;

    try {
      const payload = {
        to: token,
        title,
        body,
        sound: 'default',
        priority: 'high',
        badge: 1,
        data: data || {},
        channelId: 'default',
      };

      this.logger.log(`[Expo Push] Enviando a ${token.slice(0, 35)}... | Título: "${title}"`);

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        // Verificar si Expo reporta error en el ticket
        if (responseData?.data?.status === 'error') {
          this.logger.error(`[Expo Push] Error en ticket: ${responseData.data.message} | Details: ${JSON.stringify(responseData.data.details)}`);
          return false;
        }
        this.logger.log(`[Expo Push] ✅ Enviado exitosamente a ${token.slice(0, 35)}...`);
        return true;
      }

      this.logger.error(`[Expo Push] ❌ HTTP ${response.status}: ${JSON.stringify(responseData)}`);
      return false;
    } catch (error: any) {
      this.logger.error(`[Expo Push] ❌ Exception: ${error.message}`);
      return false;
    }
  }
}
