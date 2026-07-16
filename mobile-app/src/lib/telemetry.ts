import { Platform } from 'react-native';
import { BASE_URL } from './api';
import { storage } from './storage';

const APP_VERSION = '1.2.0';

/**
 * Reporta un error al backend para diagnóstico remoto.
 * No bloquea — fire-and-forget.
 * No requiere auth (puede fallar antes del login).
 */
export function reportError(error: string, screen?: string, extra?: Record<string, unknown>): void {
  storage.getItem('user_data').then((userData) => {
    const user = userData ? JSON.parse(userData) : null;
    fetch(`${BASE_URL}/telemetry/error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.slice(0, 500),
        screen,
        userId: user?.id,
        platform: Platform.OS,
        appVersion: APP_VERSION,
        extra,
      }),
    }).catch(() => {}); // Fire and forget
  }).catch(() => {});
}

/**
 * Reporta un evento de telemetría (opcional, para analytics internos).
 */
export function reportEvent(event: string, properties?: Record<string, unknown>): void {
  storage.getItem('user_data').then((userData) => {
    const user = userData ? JSON.parse(userData) : null;
    fetch(`${BASE_URL}/telemetry/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        properties,
        userId: user?.id,
        platform: Platform.OS,
      }),
    }).catch(() => {});
  }).catch(() => {});
}
