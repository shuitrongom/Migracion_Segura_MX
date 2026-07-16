import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Configuración remota que controla el comportamiento de la app móvil.
 * Permite cambiar funcionalidad desde el backend sin generar nuevos builds.
 *
 * IMPORTANTE: Los valores aquí se pueden cambiar en caliente editando
 * las variables de entorno en Railway o actualizando via el endpoint PATCH.
 */

interface AppRemoteConfig {
  // Control de versiones
  android: {
    minVersion: string;       // Versión mínima requerida (fuerza actualización)
    latestVersion: string;    // Última versión disponible
    storeUrl: string;         // URL de Google Play
  };
  ios: {
    minVersion: string;
    latestVersion: string;
    storeUrl: string;
  };

  // Modo mantenimiento
  maintenance: {
    enabled: boolean;
    message: string;
    estimatedEnd: string | null;  // ISO date o null
  };

  // Mensajes globales (banners en la app)
  announcement: {
    enabled: boolean;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success';
    dismissible: boolean;
  };

  // Feature flags (activar/desactivar features sin build)
  features: {
    pushNotifications: boolean;
    chat: boolean;
    crypto: boolean;
    biometricLock: boolean;
    documentUpload: boolean;
    ocrPassport: boolean;
  };

  // Timeouts y retry (la app respeta estos valores)
  network: {
    requestTimeoutMs: number;
    maxRetries: number;
    retryDelayMs: number;
  };

  // Contacto y soporte
  support: {
    whatsappNumber: string;
    email: string;
    horario: string;
  };
}

@Injectable()
export class ConfigRemoteService {
  private readonly logger = new Logger(ConfigRemoteService.name);

  // Configuración en memoria (se puede persistir en BD si se necesita)
  private config: AppRemoteConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.getDefaultConfig();
    this.logger.log('Remote config initialized');
  }

  private getDefaultConfig(): AppRemoteConfig {
    return {
      android: {
        minVersion: this.configService.get<string>('APP_ANDROID_MIN_VERSION', '1.1.3'),
        latestVersion: this.configService.get<string>('APP_ANDROID_LATEST_VERSION', '1.1.3'),
        storeUrl: 'https://play.google.com/store/apps/details?id=mx.migracion_segura.app',
      },
      ios: {
        minVersion: this.configService.get<string>('APP_IOS_MIN_VERSION', '1.1.2'),
        latestVersion: this.configService.get<string>('APP_IOS_LATEST_VERSION', '1.1.2'),
        storeUrl: 'https://apps.apple.com/app/migracion-segura-mx/id6789283931',
      },
      maintenance: {
        enabled: this.configService.get<string>('APP_MAINTENANCE_ENABLED', 'false') === 'true',
        message: this.configService.get<string>('APP_MAINTENANCE_MESSAGE', 'Estamos realizando mejoras. Volvemos pronto.'),
        estimatedEnd: this.configService.get<string>('APP_MAINTENANCE_END', null) || null,
      },
      announcement: {
        enabled: this.configService.get<string>('APP_ANNOUNCEMENT_ENABLED', 'false') === 'true',
        title: this.configService.get<string>('APP_ANNOUNCEMENT_TITLE', ''),
        message: this.configService.get<string>('APP_ANNOUNCEMENT_MESSAGE', ''),
        type: (this.configService.get<string>('APP_ANNOUNCEMENT_TYPE', 'info') as 'info' | 'warning' | 'success'),
        dismissible: true,
      },
      features: {
        pushNotifications: true,
        chat: true,
        crypto: true,
        biometricLock: true,
        documentUpload: true,
        ocrPassport: true,
      },
      network: {
        requestTimeoutMs: 30000,
        maxRetries: 2,
        retryDelayMs: 1000,
      },
      support: {
        whatsappNumber: '+5215653173104',
        email: 'admin@migracionseguramx.com',
        horario: 'Lunes a Viernes 9:00 - 18:00 (CDMX)',
      },
    };
  }

  /**
   * Retorna la configuración para la app.
   * La app llama esto al abrirse y cachea por 5 minutos.
   */
  getAppConfig(platform?: string, currentVersion?: string) {
    const response: any = { ...this.config };

    // Agregar metadata del server
    response.serverTime = new Date().toISOString();
    response.configVersion = 1;

    // Si viene la versión actual, indicar si necesita actualizar
    if (platform && currentVersion) {
      const platformConfig = platform === 'ios' ? this.config.ios : this.config.android;
      response.updateRequired = this.isVersionLower(currentVersion, platformConfig.minVersion);
      response.updateAvailable = this.isVersionLower(currentVersion, platformConfig.latestVersion);
    }

    return response;
  }

  /**
   * Admin actualiza configuración en caliente
   */
  updateConfig(updates: Record<string, unknown>) {
    // Merge parcial — solo actualiza lo que se envía
    if (updates.maintenance) {
      this.config.maintenance = { ...this.config.maintenance, ...(updates.maintenance as any) };
    }
    if (updates.announcement) {
      this.config.announcement = { ...this.config.announcement, ...(updates.announcement as any) };
    }
    if (updates.features) {
      this.config.features = { ...this.config.features, ...(updates.features as any) };
    }
    if (updates.network) {
      this.config.network = { ...this.config.network, ...(updates.network as any) };
    }
    if (updates.android) {
      this.config.android = { ...this.config.android, ...(updates.android as any) };
    }
    if (updates.ios) {
      this.config.ios = { ...this.config.ios, ...(updates.ios as any) };
    }

    this.logger.log(`[RemoteConfig] Updated: ${JSON.stringify(updates)}`);
    return { message: 'Configuración actualizada', config: this.config };
  }

  /**
   * Compara versiones semver (1.1.2 < 1.1.3)
   */
  private isVersionLower(current: string, required: string): boolean {
    const c = current.split('.').map(Number);
    const r = required.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((c[i] || 0) < (r[i] || 0)) return true;
      if ((c[i] || 0) > (r[i] || 0)) return false;
    }
    return false;
  }
}
