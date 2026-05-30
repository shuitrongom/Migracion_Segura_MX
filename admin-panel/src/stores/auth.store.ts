import { create } from 'zustand';
import { authService } from '@/lib/services/auth.service';
import type { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await authService.login(email, password);
    localStorage.setItem('last_activity', Date.now().toString());
    set({
      user: response.user,
      accessToken: response.accessToken,
      isAuthenticated: true,
    });
  },

  logout: () => {
    authService.logout();
    localStorage.removeItem('last_activity');
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  },

  initialize: () => {
    if (typeof window === 'undefined') {
      set({ isLoading: false });
      return;
    }

    const token = localStorage.getItem('access_token');
    if (token) {
      // Verificar si la sesión expiró por inactividad (15 min)
      const lastActivity = localStorage.getItem('last_activity');
      if (lastActivity) {
        const elapsed = Date.now() - parseInt(lastActivity, 10);
        if (elapsed > 15 * 60 * 1000) {
          // Sesión expirada por inactividad
          authService.logout();
          localStorage.removeItem('last_activity');
          set({ isLoading: false });
          return;
        }
      }

      // Decode JWT payload to get user info (without verification - server validates)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        set({
          user: {
            id: payload.sub || payload.id,
            email: payload.email,
            fullName: payload.fullName || '',
            role: payload.role,
            isVerified: true,
            createdAt: '',
            updatedAt: '',
          },
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        // Invalid token, clear storage
        authService.logout();
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
