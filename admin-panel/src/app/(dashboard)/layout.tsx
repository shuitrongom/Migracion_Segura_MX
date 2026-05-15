'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/lib/types';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

const ADMIN_ONLY_ROUTES = ['/asesores', '/reportes', '/automatizaciones', '/configuracion'];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm text-gray-500">Cargando...</p>
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
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
