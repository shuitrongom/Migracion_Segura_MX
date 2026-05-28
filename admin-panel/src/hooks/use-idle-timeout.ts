'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos de inactividad
const WARNING_BEFORE_MS = 2 * 60 * 1000; // Mostrar aviso 2 minutos antes

const ACTIVITY_EVENTS = [
  'mousedown', 'mousemove', 'keydown',
  'scroll', 'touchstart', 'click',
];

interface UseIdleTimeoutOptions {
  timeout?: number;
  warningBefore?: number;
  onWarning?: () => void;
  onTimeout?: () => void;
}

export function useIdleTimeout(options?: UseIdleTimeoutOptions) {
  const {
    timeout = IDLE_TIMEOUT_MS,
    warningBefore = WARNING_BEFORE_MS,
    onWarning,
    onTimeout,
  } = options || {};

  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (warningRef.current) { clearTimeout(warningRef.current); warningRef.current = null; }
    warningShownRef.current = false;
  }, []);

  const handleTimeout = useCallback(() => {
    if (onTimeout) onTimeout();
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login?reason=idle';
    }
  }, [logout, onTimeout]);

  const resetTimers = useCallback(() => {
    clearTimers();

    // Timer de warning
    warningRef.current = setTimeout(() => {
      warningShownRef.current = true;
      if (onWarning) onWarning();
    }, timeout - warningBefore);

    // Timer de logout
    timeoutRef.current = setTimeout(handleTimeout, timeout);

    // Guardar timestamp de última actividad
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_activity', Date.now().toString());
    }
  }, [clearTimers, timeout, warningBefore, onWarning, handleTimeout]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;

    // Verificar si ya expiró al cargar (por si se cerró la pestaña)
    const lastActivity = localStorage.getItem('last_activity');
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10);
      if (elapsed > timeout) {
        handleTimeout();
        return;
      }
    }

    // Iniciar timers
    resetTimers();

    // Escuchar actividad del usuario
    const handleActivity = () => { resetTimers(); };

    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Escuchar cambios en otras pestañas (storage event)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'last_activity' && e.newValue) {
        resetTimers();
      }
      // Si otra pestaña hizo logout
      if (e.key === 'access_token' && !e.newValue) {
        clearTimers();
        logout();
        window.location.href = '/login?reason=idle';
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('storage', handleStorage);
    };
  }, [isAuthenticated, resetTimers, clearTimers, handleTimeout, timeout, logout]);

  return { resetTimers };
}
