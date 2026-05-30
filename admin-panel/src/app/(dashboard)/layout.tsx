'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/lib/types';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useIdleTimeout } from '@/hooks/use-idle-timeout';

const ADMIN_ONLY_ROUTES = ['/gestores', '/reportes', '/automatizaciones', '/configuracion'];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  const handleWarning = useCallback(() => { setShowIdleWarning(true); }, []);
  const handleTimeout = useCallback(() => { setShowIdleWarning(false); }, []);

  const { resetTimers } = useIdleTimeout({
    timeout: 15 * 60 * 1000, // 15 minutos
    warningBefore: 2 * 60 * 1000, // aviso 2 min antes
    onWarning: handleWarning,
    onTimeout: handleTimeout,
  });

  const handleContinueSession = () => {
    setShowIdleWarning(false);
    resetTimers();
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Solo admin y asesor pueden acceder al panel
      if (user.role === UserRole.CLIENTE) {
        router.replace('/login');
        return;
      }
      // Redirigir asesores que intenten acceder a rutas de admin
      if (user.role === UserRole.ASESOR) {
        const isAdminRoute = ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route));
        if (isAdminRoute) {
          router.replace('/dashboard');
        }
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-sm text-white/40">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-[#0a0a0a]">{children}</main>
      </div>

      {/* Modal de aviso de inactividad */}
      {showIdleWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#171717] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Sesión por expirar</h2>
            <p className="text-sm text-white/40 mb-6">
              Tu sesión se cerrará en <span className="font-bold text-amber-600">2 minutos</span> por inactividad.
              ¿Deseas continuar trabajando?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { useAuthStore.getState().logout(); window.location.href = '/login'; }}
                className="flex-1 px-4 py-2.5 border border-[#2a2a2a] text-white/70 rounded-xl text-sm font-medium hover:bg-[#141414] transition-colors"
              >
                Cerrar sesión
              </button>
              <button
                onClick={handleContinueSession}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-200/30 transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
