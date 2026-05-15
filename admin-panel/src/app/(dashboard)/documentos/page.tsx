'use client';

import { FolderOpen } from 'lucide-react';

export default function DocumentosPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FolderOpen className="h-6 w-6 text-brand-500" />
        <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
        <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">
          Los documentos se gestionan desde el detalle de cada cliente o trámite.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Ve a Clientes → selecciona un cliente → pestaña Documentos
        </p>
      </div>
    </div>
  );
}
