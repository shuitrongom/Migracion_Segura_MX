'use client';

import { Zap, Clock } from 'lucide-react';

export default function AutomatizacionesPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Zap className="h-6 w-6 text-brand-500" />
        <h1 className="text-2xl font-bold text-gray-900">Automatizaciones</h1>
      </div>

      {/* Rules list - empty state */}
      <div className="bg-white rounded-xl border shadow-sm mb-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Reglas de Automatización</h2>
          <p className="text-sm text-gray-500 mt-1">Configura acciones automáticas basadas en eventos del sistema.</p>
        </div>
        <div className="p-12">
          <div className="text-center">
            <Zap className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No hay reglas de automatización configuradas</p>
            <p className="text-xs text-gray-400 mt-1">Próximamente</p>
          </div>
        </div>
      </div>

      {/* Execution logs - empty state */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Log de Ejecuciones</h2>
          </div>
        </div>
        <div className="p-12">
          <div className="text-center">
            <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No hay ejecuciones registradas</p>
            <p className="text-xs text-gray-400 mt-1">Las ejecuciones aparecerán aquí cuando se configuren reglas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
