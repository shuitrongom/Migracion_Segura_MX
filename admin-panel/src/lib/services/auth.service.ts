import { api } from '../api';
import type { LoginResponse, RefreshTokenResponse, UserRole } from '../types';

const ALLOWED_ROLES: UserRole[] = ['administrador' as UserRole, 'asesor' as UserRole];

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });

    // Solo administradores y asesores pueden acceder al panel
    if (!ALLOWED_ROLES.includes(data.user.role)) {
      throw new Error('No tienes permisos para acceder al panel administrativo.');
    }

    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    return data;
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const { data } = await api.post<RefreshTokenResponse>('/auth/refresh', { refreshToken });
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    return data;
  },

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};
