import { api } from '../api';
import type { LoginResponse, RefreshTokenResponse } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
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
