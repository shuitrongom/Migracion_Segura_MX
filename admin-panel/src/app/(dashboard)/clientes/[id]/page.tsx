'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, X, Send, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface ClienteDetail {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  asesor?: { fullName: string } | null;
  etiquetas: string[];
  createdAt: string;
}

interface Nota {
  id: string;
  contenido: string;
  autor?: { fullName: string } | null;
  autorId: string;
  createdAt: string;
}

interface TramiteResumen {
  id: string;
  tipo: string;
  estatus: string;
  numeroPieza: string | null;
  created_at: string;
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

const TIPO_LABELS: Record<string, string> = {
  residencia_temporal: 'Residencia Temporal',
  residencia_permanente: 'Residencia Permanente',
  regularizacion: 'Regularización',
  cambio_condicion_migratoria: 'Cambio de Condición',
  visa: 'Visa',
  nacionalidad: 'Nacionalidad',
  permiso_trabajo: 'Permiso de Trabajo',
  renovacion: 'Renovación',
  cambio_domicilio: 'Cambio de Domicilio',
  reposicion_documento: 'Reposición de Documento',
  cambio_nacionalidad: 'Cambio de Nacionalidad',
};

export default function ClienteDetailPage() {
  const params = useParams();
  const clienteId = params.id as string;

  const [cliente, setCliente] = useState<ClienteDetail | null>(null);
  const [tramites, setTramites] = useState<TramiteResumen[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('tramites');
  const [newNota, setNewNota] = useState('');
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [clienteRes, notasRes] = await Promise.all([
          api.get(`/clientes/${clienteId}`),
          api.get(`/clientes/${clienteId}/notas`),
        ]);
        setCliente(clienteRes.data);
        setNotas(notasRes.data || []);
        setEtiquetas(clienteRes.data.etiquetas || []);
        setTramites(clienteRes.data.tramites || []);
      } catch {
        setError('Error al cargar los datos del cliente');
      } finally {
        setLoading(false);
      }
    }
    if (clienteId) fetchData();
  }, [clienteId]);

  const formatDate = (dateStr: string): string => {
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr));
  };

  const formatDateTime = (dateStr: string): string => {
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  };

  const handleAddNota = async () => {
    if (!newNota.trim()) return;
    try {
      const res = await api.post(`/clientes/${clienteId}/notas`, { contenido: newNota.trim() });
      setNotas([res.data, ...notas]);
      setNewNota('');
    } catch { /* ignore */ }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !etiquetas.includes(tag)) {
        setEtiquetas([...etiquetas, tag]);
        api.post(`/clientes/${clienteId}/etiquetas`, { etiqueta: tag }).catch(() => {});
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEtiquetas(etiquetas.filter(t => t !== tag));
    api.delete(`/clientes/${clienteId}/etiquetas/${encodeURIComponent(tag)}`).catch(() => {});
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>;
  }

  if (error || !cliente) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Link href="/clientes" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold text-gray-900">Detalle del Cliente</h1>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
          <p className="text-sm text-gray-500">{error || 'No se encontró el cliente'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/clientes" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Detalle del Cliente</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 bg-brand-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-brand-600">{cliente.nombreCompleto.charAt(0)}</span>
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gestor</p>
                <p className="text-sm text-gray-900 mt-0.5">{cliente.asesor?.fullName || 'Sin asignar'}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Etiquetas</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {etiquetas.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-md text-xs font-medium">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-brand-900" aria-label={`Eliminar etiqueta ${tag}`}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Agregar etiqueta (Enter)" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="border-b">
              <nav className="flex">
                {TABS.map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} role="tab">
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="p-6">
              {activeTab === 'tramites' && (
                <div className="space-y-3">
                  {tramites.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Este cliente no tiene trámites registrados.</p>
                  ) : tramites.map(tramite => (
                    <Link key={tramite.id} href={`/tramites/${tramite.id}`} className="block p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{TIPO_LABELS[tramite.tipo] ?? tramite.tipo}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{tramite.numeroPieza || 'Sin número de pieza'}</p>
                        </div>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTATUS_BADGE[tramite.estatus] ?? 'bg-gray-50 text-gray-700'}`}>{tramite.estatus}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {activeTab === 'documentos' && (
                <div className="text-center py-12"><p className="text-sm text-gray-400">Los documentos del cliente aparecerán aquí.</p></div>
              )}
              {activeTab === 'notas' && (
                <div>
                  <div className="flex gap-3 mb-6">
                    <textarea value={newNota} onChange={(e) => setNewNota(e.target.value)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Escribe una nota interna..." rows={2} />
                    <button onClick={handleAddNota} disabled={!newNota.trim()} className="self-end px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50" aria-label="Enviar nota"><Send className="h-4 w-4" /></button>
                  </div>
                  {notas.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No hay notas registradas.</p>
                  ) : (
                    <div className="space-y-4">
                      {notas.map(nota => (
                        <div key={nota.id} className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-800">{nota.contenido}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-medium text-gray-500">{nota.autor?.fullName || 'Sistema'}</span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-400">{formatDateTime(nota.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'actividad' && (
                <div className="text-center py-12"><p className="text-sm text-gray-400">El historial de actividad aparecerá aquí.</p></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
