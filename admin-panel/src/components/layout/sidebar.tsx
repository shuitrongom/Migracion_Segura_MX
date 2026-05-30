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
  { name: 'Solicitudes', href: '/solicitudes', icon: FolderOpen },
  { name: 'Documentos', href: '/documentos', icon: FolderOpen },
  { name: 'Citas', href: '/citas', icon: Calendar },
  { name: 'Soporte', href: '/soporte', icon: MessageSquare },
  { name: 'Financiero', href: '/financiero', icon: DollarSign },
  { name: 'Reportes', href: '/reportes', icon: BarChart3, adminOnly: true },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, adminOnly: true },
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
      <div className="flex items-center h-16 px-6 border-b border-[#262626]">
        <img src="/logo.png" alt="Logo" className="h-9 w-9 mr-2 rounded" />
        <div>
          <span className="text-lg font-bold text-white">MIGRACIÓN</span>
          <span className="ml-1 text-sm text-amber-500 font-bold">SEGURA MX</span>
        </div>
      </div>

      {/* Version badge */}
      <div className="px-6 py-3">
        <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/20">
          {isAdmin ? 'ADMINISTRADOR' : 'GESTOR'}
        </span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-2 px-3">
        <ul className="space-y-0.5">
          {filteredNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500'
                      : 'text-white/50 hover:bg-[#171717]/[0.04] hover:text-white/80',
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
      <div className="p-4 border-t border-[#262626]">
        <p className="text-xs text-white/20 text-center">
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
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#0a0a0a] text-white border-r border-[#262626]">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={close} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-[#0a0a0a] text-white flex flex-col shadow-2xl border-r border-[#262626]">
            <button
              onClick={close}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-white rounded-lg"
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
