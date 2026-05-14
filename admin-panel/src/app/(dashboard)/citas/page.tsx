'use client';

import { useState } from 'react';
import { Calendar, Plus, Clock, Video, MapPin } from 'lucide-react';

interface Cita {
  id: string;
  hora: string;
  cliente: string;
  asesor: string;
  modalidad: 'videollamada' | 'presencial';
  fecha: string;
  estatus: 'programada' | 'confirmada' | 'completada' | 'cancelada';
}

const MODALIDAD_CONFIG: Record<string, { icon: typeof Video; label: string; className: string }> = {
  videollamada: { icon: Video, label: 'Videollamada', className: 'bg-blue-50 text-blue-700' },
  presencial: { icon: MapPin, label: 'Presencial', className: 'bg-green-50 text-green-700' },
};

const ESTATUS_BADGE: Record<string, { className: string; label: string }> = {
  programada: { className: 'bg-blue-50 text-blue-700', label: 'Programada' },
  confirmada: { className: 'bg-green-50 text-green-700', label: 'Confirmada' },
  completada: { className: 'bg-gray-100 text-gray-600', label: 'Completada' },
  cancelada: { className: 'bg-red-50 text-red-700', label: 'Cancelada' },
};

// Mock data
const TODAY = '2024-03-18';

const MOCK_CITAS: Cita[] = [
  // Today
  { id: '1', hora: '09:00', cliente: 'María García López', asesor: 'Carlos Mendoza', modalidad: 'videollamada', fecha: '2024-03-18', estatus: 'confirmada' },
  { id: '2', hora: '10:30', cliente: 'Pierre Dupont', asesor: 'Ana Rodríguez', modalidad: 'presencial', fecha: '2024-03-18', estatus: 'programada' },
  { id: '3', hora: '14:00', cliente: 'Hans Mueller', asesor: 'Carlos Mendoza', modalidad: 'videollamada', fecha: '2024-03-18', estatus: 'programada' },
  { id: '4', hora: '16:00', cliente: 'Anna Kowalski', asesor: 'Luis Hernández', modalidad: 'presencial', fecha: '2024-03-18', estatus: 'confirmada' },
  // Tomorrow
  { id: '5', hora: '09:30', cliente: 'John Smith', asesor: 'Ana Rodríguez', modalidad: 'videollamada', fecha: '2024-03-19', estatus: 'programada' },
  { id: '6', hora: '11:00', cliente: 'Yuki Tanaka', asesor: 'Carlos Mendoza', modalidad: 'presencial', fecha: '2024-03-19', estatus: 'programada' },
  // Day after
  { id: '7', hora: '10:00', cliente: 'María García López', asesor: 'Carlos Mendoza', modalidad: 'videollamada', fecha: '2024-03-20', estatus: 'programada' },
  // Past
  { id: '8', hora: '15:00', cliente: 'Pierre Dupont', asesor: 'Ana Rodríguez', modalidad: 'presencial', fecha: '2024-03-17', estatus: 'completada' },
  { id: '9', hora: '10:00', cliente: 'Hans Mueller', asesor: 'Luis Hernández', modalidad: 'videollamada', fecha: '2024-03-15', estatus: 'cancelada' },
];

function formatDateLabel(fecha: string): string {
  if (fecha === TODAY) return 'Hoy — 18 de marzo 2024';
  const date = new Date(fecha + 'T12:00:00');
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default function CitasPage() {
  const [showNewCita, setShowNewCita] = useState(false);

  // Group citas by date
  const citasByDate = MOCK_CITAS.reduce<Record<string, Cita[]>>((acc, cita) => {
    if (!acc[cita.fecha]) acc[cita.fecha] = [];
    acc[cita.fecha].push(cita);
    return acc;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(citasByDate).sort((a, b) => b.localeCompare(a));

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
              <label htmlFor="cita-cliente" className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <select
                id="cita-cliente"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Seleccionar cliente</option>
                <option value="1">María García López</option>
                <option value="2">John Smith</option>
                <option value="3">Pierre Dupont</option>
              </select>
            </div>
            <div>
              <label htmlFor="cita-asesor" className="block text-sm font-medium text-gray-700 mb-1">
                Asesor
              </label>
              <select
                id="cita-asesor"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Seleccionar asesor</option>
                <option value="1">Carlos Mendoza</option>
                <option value="2">Ana Rodríguez</option>
                <option value="3">Luis Hernández</option>
              </select>
            </div>
            <div>
              <label htmlFor="cita-fecha" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                id="cita-fecha"
                type="date"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label htmlFor="cita-hora" className="block text-sm font-medium text-gray-700 mb-1">
                Hora
              </label>
              <input
                id="cita-hora"
                type="time"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label htmlFor="cita-modalidad" className="block text-sm font-medium text-gray-700 mb-1">
                Modalidad
              </label>
              <select
                id="cita-modalidad"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="videollamada">Videollamada</option>
                <option value="presencial">Presencial</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowNewCita(false)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => setShowNewCita(false)}
              className="px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              Agendar
            </button>
          </div>
        </div>
      )}

      {/* Calendar list view */}
      <div className="space-y-6">
        {sortedDates.map((fecha) => {
          const isToday = fecha === TODAY;
          const citas = citasByDate[fecha];
          return (
            <div key={fecha}>
              {/* Date header */}
              <div className={`flex items-center gap-2 mb-3 ${isToday ? '' : ''}`}>
                <h2
                  className={`text-sm font-semibold capitalize ${
                    isToday ? 'text-brand-600' : 'text-gray-600'
                  }`}
                >
                  {formatDateLabel(fecha)}
                </h2>
                {isToday && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-600">
                    Hoy
                  </span>
                )}
              </div>

              {/* Appointments for this date */}
              <div className="space-y-2">
                {citas.map((cita) => {
                  const modalidadConfig = MODALIDAD_CONFIG[cita.modalidad];
                  const estatusBadge = ESTATUS_BADGE[cita.estatus];
                  const ModalidadIcon = modalidadConfig.icon;
                  return (
                    <div
                      key={cita.id}
                      className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4 ${
                        isToday ? 'border-brand-100' : ''
                      }`}
                    >
                      {/* Time */}
                      <div className="flex items-center gap-2 w-20 shrink-0">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-mono font-medium text-gray-900">
                          {cita.hora}
                        </span>
                      </div>

                      {/* Client & Asesor */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{cita.cliente}</p>
                        <p className="text-xs text-gray-500">{cita.asesor}</p>
                      </div>

                      {/* Modalidad badge */}
                      <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full ${modalidadConfig.className}`}>
                        <ModalidadIcon className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{modalidadConfig.label}</span>
                      </div>

                      {/* Estatus */}
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${estatusBadge.className}`}>
                        {estatusBadge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
