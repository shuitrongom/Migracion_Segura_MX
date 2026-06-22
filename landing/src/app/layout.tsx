import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Migración Segura MX — Gestión migratoria profesional en México',
  description: 'La primera app en México para gestionar tu trámite migratorio de forma segura. Visa, residencia, permisos de trabajo y más. Asesoría profesional desde tu celular.',
  keywords: 'migración, México, visa, residencia, trámite migratorio, INM, permiso de trabajo, regularización',
  openGraph: {
    title: 'Migración Segura MX',
    description: 'Gestiona tu trámite migratorio desde tu celular. Seguro, rápido y profesional.',
    url: 'https://migracionseguramx.com',
    siteName: 'Migración Segura MX',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.png" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
