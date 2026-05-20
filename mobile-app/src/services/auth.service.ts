import { api } from '../lib/api';
import type { LoginResponse, RegisterResponse, RefreshTokenResponse } from '../types';

export interface GoogleProfile {
  googleId: string;
  email: string;
  fullName: string;
  profilePhotoUrl?: string;
}

export interface AppleProfile {
  appleId: string;
  email: string;
  fullName?: string;
}

export const authService = {
  async register(
    email: string,
    phone: string,
    password: string,
    fullName?: string,
  ): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>('/auth/register', {
      email,
      phone,
      password,
      fullName,
    });
    return data;
  },

  async verify(userId: string, code: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/verify', { userId, code });
    return data;
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    return data;
  },

  async loginWithGoogle(profile: GoogleProfile): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/google', profile);
    return data;
  },

  async loginWithApple(profile: AppleProfile): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/apple', profile);
    return data;
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const { data } = await api.post<RefreshTokenResponse>('/auth/refresh', { refreshToken });
    return data;
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/password/reset-request', {
      email,
    });
    return data;
  },
};
