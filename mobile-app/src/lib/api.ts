import { storage } from './storage';
import { router } from 'expo-router';

export const BASE_URL = 'https://api.migracionseguramx.com/api/v1';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

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
 * API fetch con auto-refresh de token
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const token = await storage.getItem('access_token');

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch (networkError: any) {
    console.error(`[API] ❌ Network error on ${options?.method || 'GET'} ${path}:`, networkError.message);
    throw networkError;
  }

  // Log errores del servidor (4xx, 5xx) para diagnóstico
  if (!res.ok && res.status !== 401) {
    const errorBody = await res.clone().text().catch(() => '');
    console.warn(`[API] ⚠️ ${res.status} ${options?.method || 'GET'} ${path}${errorBody ? ' → ' + errorBody.slice(0, 200) : ''}`);
  }

  // Si el token expiró, intentar refresh
  if (res.status === 401) {
    // Evitar múltiples refreshes simultáneos
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken();
    }

    const refreshed = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (refreshed) {
      // Reintentar la petición con el nuevo token
      const newToken = await storage.getItem('access_token');
      return fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
          ...options?.headers,
        },
      });
    } else {
      // Refresh falló — sesión expirada, forzar logout
      await storage.deleteItem('access_token');
      await storage.deleteItem('refresh_token');
      await storage.deleteItem('user_data');
      // Navegar al login
      try { router.replace('/(auth)/login'); } catch {}
    }
  }

  return res;
}
