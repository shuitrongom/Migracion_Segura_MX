'use client';

import { MessageSquare } from 'lucide-react';

export default function SoportePage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-6 w-6 text-brand-500" />
        <h1 className="text-2xl font-bold text-gray-900">Soporte</h1>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No hay tickets de soporte abiertos.</p>
        <p className="text-sm text-gray-400 mt-2">
          Los tickets se crean desde la app móvil por los clientes.
        </p>
      </div>
    </div>
  );
}
