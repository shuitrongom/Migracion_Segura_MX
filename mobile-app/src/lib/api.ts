import { Platform } from 'react-native';
import { storage } from './storage';
import { router } from 'expo-router';

export const BASE_URL = 'https://api.migracionseguramx.com/api/v1';

// ─── Estado global ────────────────────────────────────────────────────────────
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Configuración de red (se actualiza desde remote config)
let networkConfig = {
  requestTimeoutMs: 30000,
  maxRetries: 2,
  retryDelayMs: 1000,
};

/**
 * Actualizar configuración de red desde remote config
 */
export function updateNetworkConfig(config: { requestTimeoutMs?: number; maxRetries?: number; retryDelayMs?: number }) {
  networkConfig = { ...networkConfig, ...config };
}

/**
 * Refresh token automático cuando el access token expira
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = await storage.getItem('refresh_token');
    if (!refreshToken) return false;

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    await storage.setItem('access_token', data.accessToken);
    await storage.setItem('refresh_token', data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sleep helper para retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch con timeout usando AbortController
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch (error: any) {
    clearTimeout(timer);
    if (error.name === 'AbortError') {
      throw new Error(`Timeout: la petición tardó más de ${timeoutMs / 1000}s`);
    }
    throw error;
  }
}

/**
 * API fetch enterprise con:
 * - Auto-refresh de token JWT
 * - Timeout configurable desde backend
 * - Retry automático en errores de red (no en errores 4xx)
 * - Detección de offline
 * - Logging de diagnóstico
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  // ─── Obtener token ─────────────────────────────────────────────────────
  const token = await storage.getItem('access_token');
  const method = options?.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };

  const fullUrl = `${BASE_URL}${path}`;
  const fetchOptions: RequestInit = { ...options, headers };

  // ─── Retry logic ──────────────────────────────────────────────────────
  // Solo retry en GET o en errores de red (no en POST/PATCH que mutan datos)
  const shouldRetry = method === 'GET';
  const maxAttempts = shouldRetry ? networkConfig.maxRetries + 1 : 1;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetchWithTimeout(fullUrl, fetchOptions, networkConfig.requestTimeoutMs);

      // ─── Log errores del servidor ───────────────────────────────────
      if (!res.ok && res.status !== 401) {
        const errorBody = await res.clone().text().catch(() => '');
        console.warn(`[API] ⚠️ ${res.status} ${method} ${path}${errorBody ? ' → ' + errorBody.slice(0, 200) : ''}`);
      }

      // ─── Handle 401 — Token expirado ────────────────────────────────
      if (res.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = refreshAccessToken();
        }

        const refreshed = await refreshPromise;
        isRefreshing = false;
        refreshPromise = null;

        if (refreshed) {
          const newToken = await storage.getItem('access_token');
          const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
          return fetchWithTimeout(fullUrl, { ...fetchOptions, headers: retryHeaders }, networkConfig.requestTimeoutMs);
        } else {
          await storage.deleteItem('access_token');
          await storage.deleteItem('refresh_token');
          await storage.deleteItem('user_data');
          try { router.replace('/(auth)/login'); } catch {}
        }
      }

      return res;
    } catch (error: any) {
      lastError = error;
      console.error(`[API] ❌ Attempt ${attempt}/${maxAttempts} ${method} ${path}: ${error.message}`);

      // No retry si no es GET o si es el último intento
      if (!shouldRetry || attempt === maxAttempts) break;

      // Esperar antes de reintentar (backoff exponencial)
      await sleep(networkConfig.retryDelayMs * attempt);
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  throw lastError || new Error('Error de conexión');
}
