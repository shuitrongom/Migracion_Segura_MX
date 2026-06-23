import { create } from 'zustand';
import { storage } from './storage';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  // Backgrounds
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  bgCard: string;
  bgInput: string;
  bgModal: string;
  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  // Borders
  border: string;
  borderLight: string;
  // Brand
  accent: string;
  accentLight: string;
  accentDark: string;
  // Status
  success: string;
  error: string;
  warning: string;
  info: string;
  // Gradient
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
}

const darkColors: ThemeColors = {
  bg: '#0a0a0a',
  bgSecondary: '#1c1917',
  bgTertiary: '#0f0f0f',
  bgCard: 'rgba(255,255,255,0.04)',
  bgInput: '#1e1e1e',
  bgModal: '#141414',
  text: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)',
  textInverse: '#000000',
  border: 'rgba(255,255,255,0.1)',
  borderLight: 'rgba(255,255,255,0.06)',
  accent: '#f59e0b',
  accentLight: 'rgba(245,158,11,0.1)',
  accentDark: '#d97706',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  gradientStart: '#0a0a0a',
  gradientMid: '#1c1917',
  gradientEnd: '#0f0f0f',
};

const lightColors: ThemeColors = {
  bg: '#f8f5f0',
  bgSecondary: '#ffffff',
  bgTertiary: '#f3ede4',
  bgCard: '#ffffff',
  bgInput: '#ffffff',
  bgModal: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#4a4a4a',
  textMuted: '#8a8a8a',
  textInverse: '#ffffff',
  border: '#e5ddd3',
  borderLight: '#f0ebe3',
  accent: '#d97706',
  accentLight: 'rgba(217,119,6,0.08)',
  accentDark: '#b45309',
  success: '#16a34a',
  error: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
  gradientStart: '#f8f5f0',
  gradientMid: '#ffffff',
  gradientEnd: '#f3ede4',
};

interface ThemeStore {
  mode: ThemeMode;
  colors: ThemeColors;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
  init: () => Promise<void>;
}

export const useTheme = create<ThemeStore>((set) => ({
  mode: 'light',
  colors: lightColors,
  toggle: () => set((state) => {
    const newMode = state.mode === 'dark' ? 'light' : 'dark';
    storage.setItem('theme_mode', newMode);
    return { mode: newMode, colors: newMode === 'dark' ? darkColors : lightColors };
  }),
  setMode: (mode: ThemeMode) => {
    storage.setItem('theme_mode', mode);
    set({ mode, colors: mode === 'dark' ? darkColors : lightColors });
  },
  init: async () => {
    const saved = await storage.getItem('theme_mode');
    if (saved === 'light' || saved === 'dark') {
      set({ mode: saved, colors: saved === 'dark' ? darkColors : lightColors });
    }
  },
}));

export { darkColors, lightColors };
