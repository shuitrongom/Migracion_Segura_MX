'use client';

import { useState } from 'react';
import { Zap, Clock, CheckCircle, XCircle } from 'lucide-react';

interface AutomatizacionRule {
  id: string;
  nombre: string;
  tipo: 'notificacion' | 'estatus' | 'documento' | 'recordatorio';
  descripcion: string;
  activa: boolean;
}

interface LogEntry {
  id: string;
  reglaId: string;
  reglaNombre: string;
  resultado: 'exito' | 'error';
  fecha: string;
  detalle: string;
}

const TIPO_LABELS: Record<string, { label: string; className: string }> = {
  notificacion: { label: 'Notificación', className: 'bg-blue-50 text-blue-700' },
  estatus: { label: 'Cambio de estatus', className: 'bg-purple-50 text-purple-700' },
  documento: { label: 'Documento', className: 'bg-yellow-50 text-yellow-700' },
  recordatorio: { label: 'Recordatorio', className: 'bg-green-50 text-green-700' },
};

// Mock data
const MOCK_RULES: AutomatizacionRule[] = [
  {
    id: '1',
    nombre: 'Notificar documento por vencer',
    tipo: 'notificacion',
    descripcion: 'Envía notificación push y email cuando un documento vence en 7 días.',
    activa: true,
  },
  {
    id: '2',
    nombre: 'Recordatorio de cita',
    tipo: 'recordatorio',
    descripcion: 'Envía recordatorio 24 horas antes de una cita programada.',
    activa: true,
  },
  {
    id: '3',
    nombre: 'Cambio automático a "En revisión"',
    tipo: 'estatus',
    descripcion: 'Cambia el estatus del trámite a "En revisión" cuando todos los documentos están aprobados.',
    activa: true,
  },
  {
    id: '4',
    nombre: 'Alerta de inactividad',
    tipo: 'recordatorio',
    descripcion: 'Notifica al asesor si un trámite no tiene actividad en 15 días.',
    activa: false,
  },
  {
    id: '5',
    nombre: 'Notificar documento rechazado',
    tipo: 'documento',
    descripcion: 'Envía notificación al cliente cuando un documento es rechazado con motivo.',
    activa: true,
  },
  {
    id: '6',
    nombre: 'Felicitación por aprobación',
    tipo: 'notificacion',
    descripcion: 'Envía mensaje de felicitación cuando un trámite es aprobado.',
    activa: false,
  },
];

const MOCK_LOGS: LogEntry[] = [
  {
    id: '1',
    reglaId: '1',
    reglaNombre: 'Notificar documento por vencer',
    resultado: 'exito',
    fecha: '2024-03-18 14:30',
    detalle: 'Notificación enviada a María García (Pasaporte)',
  },
  {
    id: '2',
    reglaId: '2',
    reglaNombre: 'Recordatorio de cita',
    resultado: 'exito',
    fecha: '2024-03-18 10:00',
    detalle: 'Recordatorio enviado a Pierre Dupont (Cita 19 Mar)',
  },
  {
    id: '3',
    reglaId: '3',
    reglaNombre: 'Cambio automático a "En revisión"',
    resultado: 'exito',
    fecha: '2024-03-17 16:45',
    detalle: 'Trámite MSM-2024-001234 actualizado a "En revisión"',
  },
  {
    id: '4',
    reglaId: '5',
    reglaNombre: 'Notificar documento rechazado',
    resultado: 'error',
    fecha: '2024-03-17 11:20',
    detalle: 'Error al enviar email a hans.mueller@email.com (timeout)',
  },
  {
    id: '5',
    reglaId: '2',
    reglaNombre: 'Recordatorio de cita',
    resultado: 'exito',
    fecha: '2024-03-16 10:00',
    detalle: 'Recordatorio enviado a Anna Kowalski (Cita 17 Mar)',
  },
];

export default function AutomatizacionesPage() {
  const [rules, setRules] = useState<AutomatizacionRule[]>(MOCK_RULES);

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, activa: !rule.activa } : rule)),
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Zap className="h-6 w-6 text-brand-500" />
        <h1 className="text-2xl font-bold text-gray-900">Automatizaciones</h1>
      </div>

      {/* Rules list */}
      <div className="bg-white rounded-xl border shadow-sm mb-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Reglas de Automatización</h2>
          <p className="text-sm text-gray-500 mt-1">
            Configura acciones automáticas basadas en eventos del sistema.
          </p>
        </div>
        <div className="divide-y">
          {rules.map((rule) => {
            const tipoConfig = TIPO_LABELS[rule.tipo];
            return (
              <div key={rule.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900">{rule.nombre}</h3>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${tipoConfig.className}`}
                    >
                      {tipoConfig.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{rule.descripcion}</p>
                </div>
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                    rule.activa ? 'bg-brand-500' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={rule.activa}
                  aria-label={`${rule.activa ? 'Desactivar' : 'Activar'} ${rule.nombre}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      rule.activa ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Execution logs */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Log de Ejecuciones</h2>
          </div>
        </div>
        <div className="divide-y">
          {MOCK_LOGS.map((log) => (
            <div key={log.id} className="px-6 py-3 flex items-start gap-3">
              {log.resultado === 'exito' ? (
                <CheckCircle className="h-4 w-4 text-success-500 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-danger-500 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{log.reglaNombre}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      log.resultado === 'exito'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {log.resultado === 'exito' ? 'Éxito' : 'Error'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{log.detalle}</p>
                <p className="text-xs text-gray-400 mt-0.5">{log.fecha}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
