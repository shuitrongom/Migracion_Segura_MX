'use client';

import { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';

export default function CitasPage() {
  const [showNewCita, setShowNewCita] = useState(false);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-brand-500" />
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
        </div>
        <button
          onClick={() => setShowNewCita(!showNewCita)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
          aria-label="Nueva cita"
        >
          <Plus className="h-4 w-4" />
          Nueva Cita
        </button>
      </div>

      {/* New appointment form placeholder */}
      {showNewCita && (
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Agendar Nueva Cita</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cita-cliente" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select id="cita-cliente" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Seleccionar cliente</option>
              </select>
            </div>
            <div>
              <label htmlFor="cita-asesor" className="block text-sm font-medium text-gray-700 mb-1">Asesor</label>
              <select id="cita-asesor" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Seleccionar asesor</option>
              </select>
            </div>
            <div>
              <label htmlFor="cita-fecha" className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input id="cita-fecha" type="date" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label htmlFor="cita-hora" className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <input id="cita-hora" type="time" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label htmlFor="cita-modalidad" className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
              <select id="cita-modalidad" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="videollamada">Videollamada</option>
                <option value="presencial">Presencial</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowNewCita(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button onClick={() => setShowNewCita(false)} className="px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors">Agendar</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      <div className="bg-white rounded-xl border shadow-sm p-12">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No hay citas registradas</h2>
          <p className="text-sm text-gray-500">Próximamente podrás gestionar las citas desde aquí.</p>
        </div>
      </div>
    </div>
  );
}
