'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [browserNotifGranted, setBrowserNotifGranted] = useState(false);

  // Solicitar permiso de notificaciones del navegador al montar
  useEffect(() => {
    requestBrowserNotificationPermission();
  }, []);

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await api.get('/notificaciones/unread-count');
      return res.data?.count ?? 0;
    },
    refetchInterval: 15000, // Cada 15 segundos para ser más responsivo
    staleTime: 10000,
  });

  // También traer la última notificación para mostrarla en el browser notification
  const { data: latestNotifications } = useQuery({
    queryKey: ['notifications', 'latest'],
    queryFn: async () => {
      const res = await api.get('/notificaciones?page=1&limit=3');
      return res.data?.data || [];
    },
    refetchInterval: 15000,
    staleTime: 10000,
  });

  // Cuando llega nueva notificación: sonido + browser notification
  useEffect(() => {
    if (typeof unreadCount === 'number' && unreadCount > prevCountRef.current && prevCountRef.current >= 0) {
      playNotificationSound();
      showBrowserNotification();
    }
    if (typeof unreadCount === 'number') {
      prevCountRef.current = unreadCount;
    }
  }, [unreadCount]);

  /**
   * Solicitar permiso de notificaciones del navegador (como Teams/Slack)
   */
  const requestBrowserNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      setBrowserNotifGranted(true);
      return;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      setBrowserNotifGranted(permission === 'granted');
    }
  };

  /**
   * Mostrar notificación nativa del navegador (aparece en Windows, Mac, etc.)
   */
  const showBrowserNotification = () => {
    if (!browserNotifGranted || !('Notification' in window)) return;

    const latest = latestNotifications?.[0];
    const title = latest?.titulo || 'Nueva notificación';
    const body = latest?.contenido || 'Tienes una nueva actividad en Migración Segura MX';

    try {
      const notification = new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/favicon.png',
        tag: 'msm-notification', // Reemplaza la anterior si no se ha cerrado
        requireInteraction: false,
      });

      // Click en la notificación → enfocar la pestaña y navegar
      notification.onclick = () => {
        window.focus();
        // Navegar al cliente si la notificación tiene metadata
        if (latest?.metadata?.clienteId) {
          router.push(`/clientes/${latest.metadata.clienteId}`);
        } else if (latest?.metadata?.tramiteId) {
          router.push(`/tramites`);
        } else if (latest?.metadata?.solicitudId) {
          router.push(`/solicitudes`);
        } else {
          router.push('/notificaciones');
        }
        notification.close();
      };

      // Auto-cerrar después de 8 segundos
      setTimeout(() => notification.close(), 8000);
    } catch {}
  };

  /**
   * Sonido tipo Teams — tono corto y profesional
   */
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Primer tono (ding)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.value = 830;
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.4, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);

      // Segundo tono más alto (dong)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1245;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.35);
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
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-amber-500 rounded-full flex items-center justify-center px-1 animate-pulse">
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
