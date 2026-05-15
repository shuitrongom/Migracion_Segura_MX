'use client';

import { Settings } from 'lucide-react';

export default function ConfiguracionPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-brand-500" />
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
        <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Configuración del sistema próximamente.</p>
      </div>
    </div>
  );
}
