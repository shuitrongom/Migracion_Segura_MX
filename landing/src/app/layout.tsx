import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Migración Segura MX — Gestión migratoria profesional en México',
  description: 'La primera app en México para gestionar tu trámite migratorio de forma segura. Visa, residencia temporal y permanente, permisos de trabajo, regularización migratoria y más. Asesoría profesional desde tu celular.',
  keywords: 'migración México, trámite migratorio, visa México, residencia temporal, residencia permanente, INM, permiso de trabajo México, regularización migratoria, gestoría migratoria, app migración, trámites INM, migración segura',
  openGraph: {
    title: 'Migración Segura MX — Tu trámite migratorio seguro y profesional',
    description: 'Gestiona tu visa, residencia, permisos de trabajo y más desde tu celular. Escanea tu pasaporte y un asesor te acompaña en cada paso.',
    url: 'https://migracionseguramx.com',
    siteName: 'Migración Segura MX',
    type: 'website',
    locale: 'es_MX',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Migración Segura MX',
    description: 'La primera app migratoria en México. Gestiona tu trámite ante el INM desde tu celular.',
  },
  alternates: {
    canonical: 'https://migracionseguramx.com',
  },
  robots: {
    index: true,
    follow: true,
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
