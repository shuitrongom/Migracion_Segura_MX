import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Migración Segura MX - Panel Administrativo',
  description: 'Panel de gestión migratoria para asesores y administradores',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
