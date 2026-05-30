'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Circle, Clock, Plus, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import RequisitosUpload from '@/components/requisitos-upload';

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

interface TramiteDetail {
  id: string;
  numeroPieza: string;
  tipo: string;
  estatus: string;
  clienteId: string;
  clienteNombre: string;
  etapas: Etapa[];
}

type EstatusTramite = 'borrador' | 'recibido' | 'en_revision' | 'en_espera_resolucion' | 'aprobado' | 'rechazado' | 'cancelado';

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
  borrador: 'bg-[#141414] text-white/70 border-[#2a2a2a]',
  recibido: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  en_revision: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  en_espera_resolucion: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  aprobado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rechazado: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelado: 'bg-[#141414] text-white/60 border-[#2a2a2a]',
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
  cambio_condicion_migratoria: 'Cambio de Condición',
  visa: 'Visa',
  nacionalidad: 'Nacionalidad',
  permiso_trabajo: 'Permiso de Trabajo',
  renovacion: 'Renovación',
  cambio_domicilio: 'Cambio de Domicilio',
  reposicion_documento: 'Reposición de Documento',
  cambio_nacionalidad: 'Cambio de Nacionalidad',
};

export default function TramiteDetailPage() {
  const params = useParams();
  const tramiteId = params.id as string;

  const [tramite, setTramite] = useState<TramiteDetail | null>(null);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estatus, setEstatus] = useState<EstatusTramite>('borrador');
  const [observaciones, setObservaciones] = useState('');
  const [newTarea, setNewTarea] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [tramiteRes, tareasRes] = await Promise.all([
          api.get(`/tramites/${tramiteId}`),
          api.get(`/tramites/${tramiteId}/tareas`),
        ]);
        setTramite(tramiteRes.data);
        setTareas(tareasRes.data);
        setEstatus((tramiteRes.data.estatus as EstatusTramite) || 'borrador');
      } catch {
        setError('Error al cargar los datos del trámite');
      } finally {
        setLoading(false);
      }
    }
    if (tramiteId) fetchData();
  }, [tramiteId]);

  const formatDateTime = (dateStr: string): string => {
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  };

  const handleChangeEstatus = async () => {
    try {
      await api.patch(`/tramites/${tramiteId}/estatus`, { estatus, observaciones: observaciones || undefined });
      setObservaciones('');
    } catch { /* ignore */ }
  };

  const handleAddTarea = async () => {
    if (!newTarea.trim()) return;
    try {
      const res = await api.post(`/tramites/${tramiteId}/tareas`, { titulo: newTarea.trim() });
      setTareas([...tareas, res.data]);
      setNewTarea('');
    } catch { /* ignore */ }
  };

  const handleToggleTarea = async (id: string) => {
    try {
      await api.patch(`/tramites/tareas/${id}/completar`);
      setTareas(tareas.map(t => t.id === id ? { ...t, completada: !t.completada } : t));
    } catch { /* ignore */ }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-amber-500 animate-spin" /></div>;
  }

  if (error || !tramite) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Link href="/tramites" className="p-2 rounded-lg hover:bg-[#1f1f1f] text-white/40"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold text-white">Detalle del Trámite</h1>
        </div>
        <div className="dark-card-static p-12 text-center">
          <p className="text-sm text-white/40">{error || 'No se encontró el trámite'}</p>
        </div>
      </div>
    );
  }

  const etapas = tramite.etapas || [];
  const currentEtapaIndex = etapas.findIndex(e => !e.completada);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/tramites" className="p-2 rounded-lg hover:bg-[#1f1f1f] text-white/40"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{tramite.numeroPieza || tramite.id}</h1>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${ESTATUS_BADGE[estatus] || ESTATUS_BADGE.borrador}`}>{ESTATUS_LABELS[estatus] || estatus}</span>
          </div>
          <p className="text-sm text-white/40 mt-1">{TIPO_LABELS[tramite.tipo] || tramite.tipo}{tramite.clienteNombre && ` · Cliente: ${tramite.clienteNombre}`}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Etapas */}
          <div className="dark-card-static p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Etapas del trámite</h2>
            {etapas.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-8">No hay etapas registradas para este trámite.</p>
            ) : (
              <div className="space-y-0">
                {etapas.map((etapa, index) => {
                  const isCurrent = index === currentEtapaIndex;
                  return (
                    <div key={etapa.id} className="relative flex gap-4">
                      {index < etapas.length - 1 && <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${etapa.completada ? 'bg-green-300' : 'bg-[#262626]'}`} />}
                      <div className="relative z-10 flex-shrink-0">
                        {etapa.completada ? (
                          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center"><Check className="h-4 w-4 text-white" /></div>
                        ) : isCurrent ? (
                          <div className="h-8 w-8 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center"><Clock className="h-4 w-4 text-amber-500" /></div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-[#1f1f1f] border-2 border-[#2a2a2a] flex items-center justify-center"><Circle className="h-3 w-3 text-white/30" /></div>
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${etapa.completada ? 'text-white' : isCurrent ? 'text-amber-400' : 'text-white/30'}`}>{etapa.nombre}</p>
                          {isCurrent && <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-medium">Actual</span>}
                        </div>
                        {etapa.fechaCompletada && <p className="text-xs text-white/40 mt-0.5">{formatDateTime(etapa.fechaCompletada)}</p>}
                        {etapa.observaciones && <p className="text-sm text-white/60 mt-2 bg-[#141414] rounded-lg p-3">{etapa.observaciones}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Requisitos documentales - Upload */}
          <div className="dark-card-static p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Requisitos documentales</h2>
            <RequisitosUpload tramiteId={tramiteId} tipoTramite={tramite.tipo} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Botón continuar trámite (Caso B: extranjero ya lo creó, gestor continúa) */}
          {tramite && !tramite.numeroPieza && (estatus === 'recibido' || estatus === 'borrador') && (
            <div className="bg-amber-500/10 border border-amber-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-amber-900 mb-2">Trámite pendiente de gestión</h3>
              <p className="text-xs text-amber-700 mb-4">Este trámite fue iniciado por el extranjero. Continúa con la solicitud ante el INM.</p>
              <Link href={`/tramites/continuar/${tramiteId}`} className="block w-full px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 text-center transition-colors">
                Continuar trámite →
              </Link>
            </div>
          )}
          {/* Cambiar estatus */}
          <div className="dark-card-static p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Cambiar estatus</h3>
            <div className="space-y-3">
              <select value={estatus} onChange={(e) => setEstatus(e.target.value as EstatusTramite)} className="w-full px-3 py-2.5 border border-[#2a2a2a] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" aria-label="Nuevo estatus">
                {ESTATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Observaciones (opcional)" rows={3} />
              <button onClick={handleChangeEstatus} className="w-full px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">Actualizar estatus</button>
            </div>
          </div>

          {/* Tareas */}
          <div className="dark-card-static p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Tareas internas</h3>
            {tareas.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-4">No hay tareas registradas</p>
            ) : (
              <div className="space-y-2 mb-4">
                {tareas.map(tarea => (
                  <div key={tarea.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#141414]">
                    <button onClick={() => handleToggleTarea(tarea.id)} className={`flex-shrink-0 mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center ${tarea.completada ? 'bg-green-500 border-green-500' : 'border-[#333333] hover:border-amber-500'}`} aria-label={`${tarea.completada ? 'Desmarcar' : 'Marcar'} tarea`}>
                      {tarea.completada && <Check className="h-3 w-3 text-white" />}
                    </button>
                    <p className={`text-sm ${tarea.completada ? 'text-white/30 line-through' : 'text-white/90'}`}>{tarea.titulo}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" value={newTarea} onChange={(e) => setNewTarea(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTarea()} className="flex-1 px-3 py-2 border border-[#2a2a2a] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Nueva tarea..." />
              <button onClick={handleAddTarea} disabled={!newTarea.trim()} className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50" aria-label="Agregar tarea"><Plus className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Captura de pago (solo admin) */}
          <div className="dark-card-static p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Pago de Derechos</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Monto total (MXN)</label>
                <input type="number" id="monto-pago" min="0" step="0.01" className="w-full px-3 py-2.5 border border-[#2a2a2a] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Concepto</label>
                <input type="text" id="concepto-pago" className="w-full px-3 py-2.5 border border-[#2a2a2a] rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Pago de derechos migratorios" />
              </div>
              <button
                onClick={async () => {
                  const monto = (document.getElementById('monto-pago') as HTMLInputElement)?.value;
                  const concepto = (document.getElementById('concepto-pago') as HTMLInputElement)?.value;
                  if (!monto || parseFloat(monto) <= 0) return;
                  try {
                    // Registrar pago y notificar al extranjero
                    await api.post('/financiero/pagos', {
                      clienteId: tramite?.clienteId || '',
                      tramiteId: tramiteId,
                      monto: parseFloat(monto),
                      metodoPago: 'transferencia_bancaria',
                      concepto: concepto || 'Pago de derechos migratorios',
                    });
                    toast.success('Pago registrado y notificación enviada al extranjero');
                  } catch { toast.error('Error al registrar pago'); }
                }}
                className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Registrar Pago
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
