import { create } from 'zustand';
import { storage } from '../lib/storage';
import { authService, GoogleProfile } from '../services/auth.service';
import type { User, UserRole } from '../types';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (profile: GoogleProfile) => Promise<void>;
  register: (data: {
    email: string;
    phone: string;
    password: string;
    fullName: string;
  }) => Promise<{ userId: string }>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  getUserRole: () => UserRole | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await authService.login(email, password);
    await storage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    await storage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    await storage.setItem(USER_KEY, JSON.stringify(response.user));
    set({
      user: response.user,
      isAuthenticated: true,
    });
  },

  loginWithGoogle: async (profile: GoogleProfile) => {
    const response = await authService.loginWithGoogle(profile);
    await storage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    await storage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    await storage.setItem(USER_KEY, JSON.stringify(response.user));
    set({
      user: response.user,
      isAuthenticated: true,
    });
  },

  register: async (data) => {
    const response = await authService.register(
      data.email,
      data.phone,
      data.password,
      data.fullName,
    );
    return { userId: response.userId };
  },

  logout: async () => {
    await storage.deleteItem(ACCESS_TOKEN_KEY);
    await storage.deleteItem(REFRESH_TOKEN_KEY);
    await storage.deleteItem(USER_KEY);
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  initialize: async () => {
    try {
      const token = await storage.getItem(ACCESS_TOKEN_KEY);
      const userData = await storage.getItem(USER_KEY);

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
      await storage.deleteItem(ACCESS_TOKEN_KEY);
      await storage.deleteItem(REFRESH_TOKEN_KEY);
      await storage.deleteItem(USER_KEY);
      set({ isLoading: false });
    }
  },

  getUserRole: () => {
    const state = get();
    return state.user?.role ?? null;
  },
}));
