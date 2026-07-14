'use client';

import { useEffect } from 'react';

export default function TerminosPage() {
  useEffect(() => {
    window.location.replace('/terminos-condiciones.html');
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-white/50 text-sm">Redirigiendo a Términos y Condiciones...</p>
    </main>
  );
}
