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
} from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Trámites', href: '/tramites', icon: FileText },
  { name: 'Documentos', href: '/documentos', icon: FolderOpen },
  { name: 'Citas', href: '/citas', icon: Calendar },
  { name: 'Soporte', href: '/soporte', icon: MessageSquare },
  { name: 'Financiero', href: '/financiero', icon: DollarSign },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  { name: 'Notificaciones', href: '/notificaciones', icon: Bell },
  { name: 'Automatizaciones', href: '/automatizaciones', icon: Zap },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <span className="text-lg font-bold text-brand-600">MSM</span>
        <span className="ml-2 text-sm text-gray-500">Admin</span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
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
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">Migración Segura MX v0.1.0</p>
      </div>
    </aside>
  );
}
