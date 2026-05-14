'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Circle, Clock, Plus, Send } from 'lucide-react';

interface Etapa {
  id: string;
  nombre: string;
  orden: number;
  completada: boolean;
  observaciones: string | null;
  fechaCompletada: string | null;
}

interface Tarea {
  id: string;
  titulo: string;
  completada: boolean;
  asignado: string;
  createdAt: string;
}

type EstatusTramite =
  | 'borrador'
  | 'recibido'
  | 'en_revision'
  | 'en_espera_resolucion'
  | 'aprobado'
  | 'rechazado'
  | 'cancelado';

const ESTATUS_OPTIONS: { value: EstatusTramite; label: string }[] = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'recibido', label: 'Recibido' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'en_espera_resolucion', label: 'En espera de resolución' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const ESTATUS_BADGE: Record<EstatusTramite, string> = {
  borrador: 'bg-gray-50 text-gray-700 border-gray-200',
  recibido: 'bg-blue-50 text-blue-700 border-blue-200',
  en_revision: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  en_espera_resolucion: 'bg-orange-50 text-orange-700 border-orange-200',
  aprobado: 'bg-green-50 text-green-700 border-green-200',
  rechazado: 'bg-red-50 text-red-700 border-red-200',
  cancelado: 'bg-gray-50 text-gray-600 border-gray-200',
};

const ESTATUS_LABELS: Record<EstatusTramite, string> = {
  borrador: 'Borrador',
  recibido: 'Recibido',
  en_revision: 'En revisión',
  en_espera_resolucion: 'En espera',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
};

const TIPO_LABELS: Record<string, string> = {
  residencia_temporal: 'Residencia Temporal',
  residencia_permanente: 'Residencia Permanente',
  regularizacion: 'Regularización',
  visa: 'Visa',
  nacionalidad: 'Nacionalidad',
  permiso_trabajo: 'Permiso de Trabajo',
  renovacion: 'Renovación',
};

// Mock data
const MOCK_ETAPAS: Etapa[] = [
  {
    id: 'e1',
    nombre: 'Recepción de documentos',
    orden: 1,
    completada: true,
    observaciones: 'Documentos recibidos correctamente. Expediente completo.',
    fechaCompletada: '2024-03-15T10:00:00Z',
  },
  {
    id: 'e2',
    nombre: 'Revisión inicial',
    orden: 2,
    completada: true,
    observaciones: 'Revisión completada. Todo en orden.',
    fechaCompletada: '2024-03-17T14:30:00Z',
  },
  {
    id: 'e3',
    nombre: 'Análisis de expediente',
    orden: 3,
    completada: false,
    observaciones: 'En proceso de análisis por el asesor asignado.',
    fechaCompletada: null,
  },
  {
    id: 'e4',
    nombre: 'Presentación ante INM',
    orden: 4,
    completada: false,
    observaciones: null,
    fechaCompletada: null,
  },
  {
    id: 'e5',
    nombre: 'Resolución y entrega',
    orden: 5,
    completada: false,
    observaciones: null,
    fechaCompletada: null,
  },
];

const MOCK_TAREAS: Tarea[] = [
  {
    id: 'ta1',
    titulo: 'Verificar vigencia del pasaporte',
    completada: true,
    asignado: 'Carlos Mendoza',
    createdAt: '2024-03-15T10:00:00Z',
  },
  {
    id: 'ta2',
    titulo: 'Solicitar comprobante de domicilio actualizado',
    completada: false,
    asignado: 'Carlos Mendoza',
    createdAt: '2024-03-17T14:30:00Z',
  },
  {
    id: 'ta3',
    titulo: 'Agendar cita en INM',
    completada: false,
    asignado: 'Ana Rodríguez',
    createdAt: '2024-03-18T09:00:00Z',
  },
];

export default function TramiteDetailPage() {
  const [estatus, setEstatus] = useState<EstatusTramite>('en_revision');
  const [observaciones, setObservaciones] = useState('');
  const [tareas, setTareas] = useState<Tarea[]>(MOCK_TAREAS);
  const [newTarea, setNewTarea] = useState('');

  const formatDateTime = (dateStr: string): string => {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const handleChangeEstatus = () => {
    // In production, this would call the API
    alert(`Estatus cambiado a: ${ESTATUS_LABELS[estatus]}${observaciones ? `\nObservaciones: ${observaciones}` : ''}`);
    setObservaciones('');
  };

  const handleAddTarea = () => {
    if (!newTarea.trim()) return;
    const tarea: Tarea = {
      id: `ta${Date.now()}`,
      titulo: newTarea.trim(),
      completada: false,
      asignado: 'Admin',
      createdAt: new Date().toISOString(),
    };
    setTareas([...tareas, tarea]);
    setNewTarea('');
  };

  const handleToggleTarea = (id: string) => {
    setTareas(
      tareas.map((t) => (t.id === id ? { ...t, completada: !t.completada } : t)),
    );
  };

  const currentEtapaIndex = MOCK_ETAPAS.findIndex((e) => !e.completada);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/tramites"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          aria-label="Volver a trámites"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">MSM-2024-001234</h1>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${ESTATUS_BADGE[estatus]}`}
            >
              {ESTATUS_LABELS[estatus]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {TIPO_LABELS['residencia_temporal']} · Cliente: María García López
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Etapas del trámite</h2>
            <div className="space-y-0">
              {MOCK_ETAPAS.map((etapa, index) => {
                const isCurrent = index === currentEtapaIndex;
                return (
                  <div key={etapa.id} className="relative flex gap-4">
                    {/* Vertical line */}
                    {index < MOCK_ETAPAS.length - 1 && (
                      <div
                        className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${
                          etapa.completada ? 'bg-green-300' : 'bg-gray-200'
                        }`}
                      />
                    )}

                    {/* Icon */}
                    <div className="relative z-10 flex-shrink-0">
                      {etapa.completada ? (
                        <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      ) : isCurrent ? (
                        <div className="h-8 w-8 rounded-full bg-brand-100 border-2 border-brand-500 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-brand-600" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                          <Circle className="h-3 w-3 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-8">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-medium ${
                            etapa.completada
                              ? 'text-gray-900'
                              : isCurrent
                                ? 'text-brand-700'
                                : 'text-gray-400'
                          }`}
                        >
                          {etapa.nombre}
                        </p>
                        {isCurrent && (
                          <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                            Actual
                          </span>
                        )}
                      </div>
                      {etapa.fechaCompletada && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDateTime(etapa.fechaCompletada)}
                        </p>
                      )}
                      {etapa.observaciones && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-3">
                          {etapa.observaciones}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Documents placeholder */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentos</h2>
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">
                Los documentos asociados a este trámite aparecerán aquí.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Change estatus */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Cambiar estatus</h3>
            <div className="space-y-3">
              <select
                value={estatus}
                onChange={(e) => setEstatus(e.target.value as EstatusTramite)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                aria-label="Nuevo estatus"
              >
                {ESTATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Observaciones (opcional)"
                rows={3}
                aria-label="Observaciones del cambio de estatus"
              />
              <button
                onClick={handleChangeEstatus}
                className="w-full px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
              >
                Actualizar estatus
              </button>
            </div>
          </div>

          {/* Tareas internas */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Tareas internas</h3>
            <div className="space-y-2 mb-4">
              {tareas.map((tarea) => (
                <div
                  key={tarea.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50"
                >
                  <button
                    onClick={() => handleToggleTarea(tarea.id)}
                    className={`flex-shrink-0 mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                      tarea.completada
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 hover:border-brand-500'
                    }`}
                    aria-label={`${tarea.completada ? 'Desmarcar' : 'Marcar'} tarea: ${tarea.titulo}`}
                  >
                    {tarea.completada && <Check className="h-3 w-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        tarea.completada ? 'text-gray-400 line-through' : 'text-gray-800'
                      }`}
                    >
                      {tarea.titulo}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{tarea.asignado}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add task */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTarea}
                onChange={(e) => setNewTarea(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTarea()}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Nueva tarea..."
                aria-label="Nueva tarea interna"
              />
              <button
                onClick={handleAddTarea}
                disabled={!newTarea.trim()}
                className="p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Agregar tarea"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
