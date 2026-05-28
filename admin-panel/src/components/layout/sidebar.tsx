'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  Calendar,
  Bell,
  DollarSign,
  BarChart3,
  MessageSquare,
  Settings,
  Zap,
  UserCog,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/stores/auth.store';
import { useSidebarStore } from '@/stores/sidebar.store';
import { UserRole } from '@/lib/types';

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Extranjeros', href: '/clientes', icon: Users },
  { name: 'Gestores', href: '/gestores', icon: UserCog, adminOnly: true },
  { name: 'Trámites', href: '/tramites', icon: FileText },
  { name: 'Documentos', href: '/documentos', icon: FolderOpen },
  { name: 'Citas', href: '/citas', icon: Calendar },
  { name: 'Soporte', href: '/soporte', icon: MessageSquare },
  { name: 'Financiero', href: '/financiero', icon: DollarSign },
  { name: 'Reportes', href: '/reportes', icon: BarChart3, adminOnly: true },
  { name: 'Notificaciones', href: '/notificaciones', icon: Bell },
  { name: 'Automatizaciones', href: '/automatizaciones', icon: Zap, adminOnly: true },
  { name: 'Configuración', href: '/configuracion', icon: Settings, adminOnly: true },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === UserRole.ADMINISTRADOR;

  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  return (
    <>
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-brand-400/30">
        <img src="/logo.png" alt="Logo" className="h-9 w-9 mr-2 rounded" />
        <div>
          <span className="text-lg font-bold text-gold-400">MIGRACIÓN</span>
          <span className="ml-1 text-sm text-brand-200">SEGURA MX</span>
        </div>
      </div>

      {/* Version badge */}
      <div className="px-6 py-3">
        <span className="inline-block px-3 py-1 bg-gold-500/20 text-gold-300 text-xs font-medium rounded-full border border-gold-500/30">
          {isAdmin ? 'ADMINISTRADOR' : 'GESTOR'}
        </span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-2 px-3">
        <ul className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gold-500/20 text-gold-300'
                      : 'text-brand-200 hover:bg-brand-400/20 hover:text-white',
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-brand-400/30">
        <p className="text-xs text-brand-300 text-center">
          Panel de gestión y control de trámites y clientes.
        </p>
      </div>
    </>
  );
}

export function Sidebar() {
  const { isOpen, close } = useSidebarStore();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-brand-500 text-white">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50" onClick={close} />
          
          {/* Sidebar panel */}
          <aside className="fixed inset-y-0 left-0 w-72 bg-brand-500 text-white flex flex-col shadow-xl">
            {/* Close button */}
            <button
              onClick={close}
              className="absolute top-4 right-4 p-2 text-brand-200 hover:text-white rounded-lg"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={close} />
          </aside>
        </div>
      )}
    </>
  );
}
