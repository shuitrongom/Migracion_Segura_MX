'use client';

import { useEffect, useRef } from 'react';
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
  const prevCountRef = useRef<number>(0);

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await api.get('/notificaciones/unread-count');
      return res.data?.count ?? 0;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Reproducir sonido cuando llega una nueva notificación
  useEffect(() => {
    if (typeof unreadCount === 'number' && unreadCount > prevCountRef.current && prevCountRef.current >= 0) {
      playNotificationSound();
    }
    if (typeof unreadCount === 'number') {
      prevCountRef.current = unreadCount;
    }
  }, [unreadCount]);

  const playNotificationSound = () => {
    try {
      // Usar Web Audio API para generar un tono de notificación
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 880; // La nota A5
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      oscillator.stop(ctx.currentTime + 0.3);

      // Segundo tono (ding-dong)
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = 1174; // D6
          osc2.type = 'sine';
          gain2.gain.value = 0.2;
          osc2.start();
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc2.stop(ctx.currentTime + 0.4);
        } catch {}
      }, 150);
    } catch {}
  };

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
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-amber-500 rounded-full flex items-center justify-center px-1">
              <span className="text-[10px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2 p-2">
          <div className="h-8 w-8 bg-[#171717]/[0.04] border border-[#3a3a3a] rounded-full flex items-center justify-center">
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
