'use client';

import { Bell, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        {/* Breadcrumb o título de página */}
      </div>

      <div className="flex items-center gap-4">
        {/* Notificaciones */}
        <button
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </button>

        {/* Perfil */}
        <div className="flex items-center gap-2 p-2">
          <div className="h-8 w-8 bg-brand-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-brand-600" />
          </div>
          <span className="text-sm font-medium text-gray-700 hidden md:block">
            {user?.fullName || user?.email || 'Admin'}
          </span>
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:block">Salir</span>
        </button>
      </div>
    </header>
  );
}
