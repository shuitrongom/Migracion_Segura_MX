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

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await api.get('/notificaciones/unread-count');
      return res.data?.count ?? 0;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-[#0a0a0a] border-b border-[#262626] flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-white/70 hover:bg-[#171717]/[0.04] rounded-lg transition"
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Link
          href="/notificaciones"
          className="relative p-2 text-white/70 hover:text-amber-400 hover:bg-[#171717]/[0.04] rounded-lg transition-all duration-200"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
          )}
        </Link>

        <div className="flex items-center gap-2 p-2">
          <div className="h-8 w-8 bg-[#171717]/[0.04] border border-[#2a2a2a] rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white/70" />
          </div>
          <span className="text-sm font-medium text-white/70 hidden md:block">
            {user?.fullName || user?.email || 'Admin'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.06] rounded-lg transition-all duration-200"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:block">Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}
