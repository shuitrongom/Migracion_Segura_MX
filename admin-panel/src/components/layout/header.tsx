'use client';

import { Bell, User, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useSidebarStore } from '@/stores/sidebar.store';

export function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const toggleSidebar = useSidebarStore((s) => s.toggle);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-brand-100 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger - solo móvil */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-brand-500 hover:bg-brand-50 rounded-lg transition"
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Notificaciones */}
        <button
          className="relative p-2 text-brand-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-danger-500 rounded-full" />
        </button>

        {/* Perfil */}
        <div className="flex items-center gap-2 p-2">
          <div className="h-8 w-8 bg-brand-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-brand-500" />
          </div>
          <span className="text-sm font-medium text-brand-700 hidden md:block">
            {user?.fullName || user?.email || 'Admin'}
          </span>
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-danger-500 hover:bg-danger-50 rounded-lg transition"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:block">Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}
