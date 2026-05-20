import { storage } from './storage';

const BASE_URL = 'https://backend-production-79ed.up.railway.app/api/v1';

export async function apiFetch(path: string, options?: RequestInit) {
  const token = await storage.getItem('access_token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    await storage.deleteItem('access_token');
    await storage.deleteItem('user_data');
  }
  return res;
}
