'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Send } from 'lucide-react';

interface Cliente {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  asesor: string;
  etiquetas: string[];
  createdAt: string;
}

interface Nota {
  id: string;
  contenido: string;
  autor: string;
  createdAt: string;
}

interface TramiteResumen {
  id: string;
  tipo: string;
  estatus: string;
  numeroPieza: string;
  fecha: string;
}

type TabKey = 'tramites' | 'documentos' | 'notas' | 'actividad';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'tramites', label: 'Trámites' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'notas', label: 'Notas' },
  { key: 'actividad', label: 'Actividad' },
];

const ESTATUS_BADGE: Record<string, string> = {
  en_revision: 'bg-yellow-50 text-yellow-700',
  recibido: 'bg-blue-50 text-blue-700',
  aprobado: 'bg-green-50 text-green-700',
  rechazado: 'bg-red-50 text-red-700',
  borrador: 'bg-gray-50 text-gray-700',
  en_espera_resolucion: 'bg-orange-50 text-orange-700',
};

const ESTATUS_LABELS: Record<string, string> = {
  en_revision: 'En revisión',
  recibido: 'Recibido',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  borrador: 'Borrador',
  en_espera_resolucion: 'En espera',
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
const MOCK_CLIENTE: Cliente = {
  id: '1',
  nombreCompleto: 'María García López',
  email: 'maria.garcia@email.com',
  telefono: '+52 55 1234 5678',
  asesor: 'Carlos Mendoza',
  etiquetas: ['urgente', 'vip'],
  createdAt: '2024-01-15T10:00:00Z',
};

const MOCK_TRAMITES: TramiteResumen[] = [
  {
    id: 't1',
    tipo: 'residencia_temporal',
    estatus: 'en_revision',
    numeroPieza: 'MSM-2024-001234',
    fecha: '2024-03-15',
  },
  {
    id: 't2',
    tipo: 'permiso_trabajo',
    estatus: 'borrador',
    numeroPieza: '',
    fecha: '2024-03-20',
  },
];

const MOCK_NOTAS: Nota[] = [
  {
    id: 'n1',
    contenido: 'Cliente contactado por teléfono. Confirmó que enviará los documentos faltantes esta semana.',
    autor: 'Carlos Mendoza',
    createdAt: '2024-03-18T14:30:00Z',
  },
  {
    id: 'n2',
    contenido: 'Se recibieron los documentos. Pendiente revisión de pasaporte.',
    autor: 'Ana Rodríguez',
    createdAt: '2024-03-15T10:00:00Z',
  },
];

export default function ClienteDetailPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('tramites');
  const [notas, setNotas] = useState<Nota[]>(MOCK_NOTAS);
  const [newNota, setNewNota] = useState('');
  const [etiquetas, setEtiquetas] = useState<string[]>(MOCK_CLIENTE.etiquetas);
  const [tagInput, setTagInput] = useState('');

  const cliente = MOCK_CLIENTE;

  const formatDate = (dateStr: string): string => {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  const formatDateTime = (dateStr: string): string => {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const handleAddNota = () => {
    if (!newNota.trim()) return;
    const nota: Nota = {
      id: `n${Date.now()}`,
      contenido: newNota.trim(),
      autor: 'Admin',
      createdAt: new Date().toISOString(),
    };
    setNotas([nota, ...notas]);
    setNewNota('');
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !etiquetas.includes(tag)) {
        setEtiquetas([...etiquetas, tag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEtiquetas(etiquetas.filter((t) => t !== tag));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/clientes"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          aria-label="Volver a clientes"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Detalle del Cliente</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 bg-brand-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-brand-600">
                  {cliente.nombreCompleto.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{cliente.nombreCompleto}</h2>
                <p className="text-sm text-gray-500">Cliente desde {formatDate(cliente.createdAt)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                <p className="text-sm text-gray-900 mt-0.5">{cliente.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Teléfono</p>
                <p className="text-sm text-gray-900 mt-0.5">{cliente.telefono}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Asesor</p>
                <p className="text-sm text-gray-900 mt-0.5">{cliente.asesor}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Etiquetas
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {etiquetas.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-md text-xs font-medium"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-brand-900"
                      aria-label={`Eliminar etiqueta ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Agregar etiqueta (Enter)"
                aria-label="Agregar etiqueta"
              />
            </div>
          </div>
        </div>

        {/* Tabs content */}
        <div className="lg:col-span-2">
          {/* Tab navigation */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="border-b">
              <nav className="flex" aria-label="Pestañas del cliente">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-brand-500 text-brand-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    aria-selected={activeTab === tab.key}
                    role="tab"
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Trámites tab */}
              {activeTab === 'tramites' && (
                <div className="space-y-3">
                  {MOCK_TRAMITES.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                      Este cliente no tiene trámites registrados.
                    </p>
                  ) : (
                    MOCK_TRAMITES.map((tramite) => (
                      <Link
                        key={tramite.id}
                        href={`/tramites/${tramite.id}`}
                        className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {TIPO_LABELS[tramite.tipo] ?? tramite.tipo}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {tramite.numeroPieza || 'Sin número de pieza'} · {tramite.fecha}
                            </p>
                          </div>
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              ESTATUS_BADGE[tramite.estatus] ?? 'bg-gray-50 text-gray-700'
                            }`}
                          >
                            {ESTATUS_LABELS[tramite.estatus] ?? tramite.estatus}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {/* Documentos tab */}
              {activeTab === 'documentos' && (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-400">
                    Los documentos del cliente aparecerán aquí.
                  </p>
                </div>
              )}

              {/* Notas tab */}
              {activeTab === 'notas' && (
                <div>
                  {/* Add note form */}
                  <div className="flex gap-3 mb-6">
                    <textarea
                      value={newNota}
                      onChange={(e) => setNewNota(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="Escribe una nota interna..."
                      rows={2}
                      aria-label="Nueva nota interna"
                    />
                    <button
                      onClick={handleAddNota}
                      disabled={!newNota.trim()}
                      className="self-end px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Enviar nota"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Notes list */}
                  <div className="space-y-4">
                    {notas.map((nota) => (
                      <div key={nota.id} className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-800">{nota.contenido}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-medium text-gray-500">{nota.autor}</span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-400">
                            {formatDateTime(nota.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actividad tab */}
              {activeTab === 'actividad' && (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-400">
                    El historial de actividad aparecerá aquí.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
