import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/auth.service';
import type { User } from '../types';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, phone: string, password: string) => Promise<{ userId: string }>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await authService.login(email, password);
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, response.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.refreshToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));
    set({
      user: response.user,
      isAuthenticated: true,
    });
  },

  register: async (email: string, phone: string, password: string) => {
    const response = await authService.register(email, phone, password);
    return { userId: response.userId };
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      const userData = await SecureStore.getItemAsync(USER_KEY);

      if (token && userData) {
        const user = JSON.parse(userData) as User;
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      // Clear corrupted data
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      set({ isLoading: false });
    }
  },
}));
