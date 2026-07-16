import { Platform } from 'react-native';
import { storage } from './storage';
import { BASE_URL } from './api';

const CONFIG_CACHE_KEY = 'remote_config';
const CONFIG_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export interface RemoteConfig {
  // Control de versiones
  android: { minVersion: string; latestVersion: string; storeUrl: string };
  ios: { minVersion: string; latestVersion: string; storeUrl: string };
  // Mantenimiento
  maintenance: { enabled: boolean; message: string; estimatedEnd: string | null };
  // Anuncios
  announcement: { enabled: boolean; title: string; message: string; type: 'info' | 'warning' | 'success'; dismissible: boolean };
  // Features
  features: { pushNotifications: boolean; chat: boolean; crypto: boolean; biometricLock: boolean; documentUpload: boolean; ocrPassport: boolean };
  // Network
  network: { requestTimeoutMs: number; maxRetries: number; retryDelayMs: number };
  // Soporte
  support: { whatsappNumber: string; email: string; horario: string };
  // Calculados por el server
  updateRequired?: boolean;
  updateAvailable?: boolean;
  serverTime?: string;
}

const DEFAULT_CONFIG: RemoteConfig = {
  android: { minVersion: '1.0.0', latestVersion: '1.1.3', storeUrl: '' },
  ios: { minVersion: '1.0.0', latestVersion: '1.1.2', storeUrl: '' },
  maintenance: { enabled: false, message: '', estimatedEnd: null },
  announcement: { enabled: false, title: '', message: '', type: 'info', dismissible: true },
  features: { pushNotifications: true, chat: true, crypto: true, biometricLock: true, documentUpload: true, ocrPassport: true },
  network: { requestTimeoutMs: 30000, maxRetries: 2, retryDelayMs: 1000 },
  support: { whatsappNumber: '+5215653173104', email: 'admin@migracionseguramx.com', horario: 'Lunes a Viernes 9:00 - 18:00' },
};

let cachedConfig: RemoteConfig | null = null;
let lastFetchTime = 0;

/**
 * Obtiene la configuración remota del backend.
 * Usa caché de 5 minutos para no hacer requests innecesarios.
 * Si falla, retorna la última config conocida o los defaults.
 */
export async function getRemoteConfig(): Promise<RemoteConfig> {
  const now = Date.now();

  // Si el cache es reciente, usar ese
  if (cachedConfig && (now - lastFetchTime) < CONFIG_CACHE_DURATION) {
    return cachedConfig;
  }

  try {
    const appVersion = '1.1.3'; // Se puede leer de Constants.expoConfig
    const platform = Platform.OS;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(
      `${BASE_URL}/config/app?platform=${platform}&version=${appVersion}`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      cachedConfig = { ...DEFAULT_CONFIG, ...data };
      lastFetchTime = now;

      // Persistir para uso offline
      await storage.setItem(CONFIG_CACHE_KEY, JSON.stringify(cachedConfig)).catch(() => {});

      return cachedConfig;
    }
  } catch (error) {
    console.log('[RemoteConfig] Fetch failed, using cached/default');
  }

  // Fallback: intentar cargar del storage local
  if (!cachedConfig) {
    try {
      const stored = await storage.getItem(CONFIG_CACHE_KEY);
      if (stored) {
        cachedConfig = JSON.parse(stored);
        return cachedConfig!;
      }
    } catch {}
  }

  return cachedConfig || DEFAULT_CONFIG;
}

/**
 * Verifica si la app necesita actualización forzosa
 */
export function isUpdateRequired(config: RemoteConfig): boolean {
  return config.updateRequired === true;
}

/**
 * Verifica si hay una actualización disponible (no forzosa)
 */
export function isUpdateAvailable(config: RemoteConfig): boolean {
  return config.updateAvailable === true && !config.updateRequired;
}

/**
 * Verifica si el modo mantenimiento está activo
 */
export function isMaintenanceMode(config: RemoteConfig): boolean {
  return config.maintenance.enabled === true;
}

/**
 * Obtiene la URL de la tienda para actualizar
 */
export function getStoreUrl(config: RemoteConfig): string {
  return Platform.OS === 'ios' ? config.ios.storeUrl : config.android.storeUrl;
}
