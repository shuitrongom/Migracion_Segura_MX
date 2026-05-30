'use client';

import { Bell, User, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useSidebarStore } from '@/stores/sidebar.store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';

export function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const toggleSidebar = useSidebarStore((s) => s.toggle);

  // Consultar notificaciones no leídas
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await api.get('/notificaciones/unread-count');
      return res.data?.count ?? 0;
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
    staleTime: 10000,
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-[#0a1628] border-b border-cyan-900/30 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-cyan-400 hover:bg-slate-800 rounded-lg transition"
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Notificaciones */}
        <Link
          href="/notificaciones"
          className="relative p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-all duration-300"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" />
          )}
        </Link>

        {/* Perfil */}
        <div className="flex items-center gap-2 p-2">
          <div className="h-8 w-8 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="text-sm font-medium text-slate-300 hidden md:block">
            {user?.fullName || user?.email || 'Admin'}
          </span>
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition-all duration-300"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:block">Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}
