'use client';

import { useEffect } from 'react';

export default function PrivacidadPage() {
  useEffect(() => {
    window.location.replace('/politica-privacidad.html');
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-white/50 text-sm">Redirigiendo al Aviso de Privacidad...</p>
    </main>
  );
}
