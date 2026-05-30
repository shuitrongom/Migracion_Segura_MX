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
  borrador: 'bg-[#1a1a1a] text-white/70 border-[#3a3a3a]',
  recibido: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  en_revision: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  en_espera_resolucion: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  aprobado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rechazado: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelado: 'bg-[#1a1a1a] text-white/70 border-[#3a3a3a]',
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
          <Link href="/tramites" className="p-2 rounded-lg hover:bg-[#222222] text-white/70"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold text-white">Detalle del Trámite</h1>
        </div>
        <div className="dark-card-static p-12 text-center">
          <p className="text-sm text-white/70">{error || 'No se encontró el trámite'}</p>
        </div>
      </div>
    );
  }

  const etapas = tramite.etapas || [];
  const currentEtapaIndex = etapas.findIndex(e => !e.completada);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/tramites" className="p-2 rounded-lg hover:bg-[#222222] text-white/70"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{tramite.numeroPieza || tramite.id}</h1>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${ESTATUS_BADGE[estatus] || ESTATUS_BADGE.borrador}`}>{ESTATUS_LABELS[estatus] || estatus}</span>
          </div>
          <p className="text-sm text-white/70 mt-1">{TIPO_LABELS[tramite.tipo] || tramite.tipo}{tramite.clienteNombre && ` · Cliente: ${tramite.clienteNombre}`}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Etapas */}
          <div className="dark-card-static p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Etapas del trámite</h2>
            {etapas.length === 0 ? (
              <p className="text-sm text-white/70 text-center py-8">No hay etapas registradas para este trámite.</p>
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
                          <div className="h-8 w-8 rounded-full bg-[#222222] border-2 border-[#3a3a3a] flex items-center justify-center"><Circle className="h-3 w-3 text-white/70" /></div>
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${etapa.completada ? 'text-white' : isCurrent ? 'text-amber-400' : 'text-white/70'}`}>{etapa.nombre}</p>
                          {isCurrent && <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-medium">Actual</span>}
                        </div>
                        {etapa.fechaCompletada && <p className="text-xs text-white/70 mt-0.5">{formatDateTime(etapa.fechaCompletada)}</p>}
                        {etapa.observaciones && <p className="text-sm text-white/70 mt-2 bg-[#1a1a1a] rounded-lg p-3">{etapa.observaciones}</p>}
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
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-amber-300 mb-2">Trámite pendiente de gestión</h3>
              <p className="text-xs text-amber-200/80 mb-4">Este trámite fue iniciado por el extranjero. Continúa con la solicitud ante el INM.</p>
              <Link href={`/tramites/continuar/${tramiteId}`} className="block w-full px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 text-center transition-colors">
                Continuar trámite →
              </Link>
            </div>
          )}
          {/* Cambiar estatus */}
          <div className="dark-card-static p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Cambiar estatus</h3>
            <div className="space-y-3">
              <select value={estatus} onChange={(e) => setEstatus(e.target.value as EstatusTramite)} className="w-full px-3 py-2.5 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" aria-label="Nuevo estatus">
                {ESTATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full px-3 py-2.5 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" placeholder="Observaciones (opcional)" rows={3} />
              <button onClick={handleChangeEstatus} className="w-full px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">Actualizar estatus</button>
            </div>
          </div>

          {/* Pagos del trámite */}
          <PagosDelTramite tramiteId={tramiteId} clienteId={tramite?.clienteId} />
        </div>
      </div>
    </div>
  );
}

function PagosDelTramite({ tramiteId, clienteId }: { tramiteId: string; clienteId?: string }) {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPagos() {
      try {
        const res = await api.get(`/financiero/pagos?tramiteId=${tramiteId}`);
        setPagos(res.data?.data || res.data || []);
      } catch {
        setPagos([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPagos();
  }, [tramiteId]);

  const formatCurrency = (n: number) => `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const ESTATUS_PAGO: Record<string, { label: string; color: string }> = {
    pendiente: { label: 'Pendiente', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    aprobado: { label: 'Pagado', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    rechazado: { label: 'Rechazado', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    cancelado: { label: 'Cancelado', color: 'bg-[#222222] text-white/70 border-[#3a3a3a]' },
    reembolsado: { label: 'Reembolsado', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  };

  const TIPO_PAGO: Record<string, string> = {
    anticipo: 'Anticipo (50%)',
    liquidacion: 'Liquidación (50%)',
    pago_unico: 'Pago único',
  };

  return (
    <div className="dark-card-static p-6">
      <h3 className="text-sm font-semibold text-white mb-4">💳 Pagos del trámite</h3>
      {loading ? (
        <p className="text-sm text-white/70 text-center py-4">Cargando pagos...</p>
      ) : pagos.length === 0 ? (
        <p className="text-sm text-white/70 text-center py-4">No hay pagos registrados para este trámite.</p>
      ) : (
        <div className="space-y-3">
          {pagos.map((pago: any) => {
            const estatus = ESTATUS_PAGO[pago.estatusPago || pago.estatus_pago] || ESTATUS_PAGO.pendiente;
            const tipo = TIPO_PAGO[pago.tipoPago || pago.tipo_pago] || 'Pago';
            return (
              <div key={pago.id} className="p-3 rounded-lg border border-[#3a3a3a] bg-[#1a1a1a]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white/70">{tipo}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${estatus.color}`}>{estatus.label}</span>
                </div>
                <p className="text-lg font-bold text-white">{formatCurrency(pago.monto)}</p>
                <p className="text-xs text-white/70 mt-1">{pago.concepto}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-white/70">
                  {pago.fechaPago && <span>Pagado: {formatDate(pago.fechaPago)}</span>}
                  {pago.fechaVencimiento && <span>Vence: {formatDate(pago.fechaVencimiento)}</span>}
                  {pago.mercadopagoInitPoint && (
                    <a href={pago.mercadopagoInitPoint} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300">Ver link MP</a>
                  )}
                </div>
              </div>
            );
          })}
          {/* Total */}
          <div className="pt-2 border-t border-[#3a3a3a] flex items-center justify-between">
            <span className="text-xs font-semibold text-white/70">Monto total del trámite</span>
            <span className="text-sm font-bold text-amber-400">{formatCurrency(pagos[0]?.montoTotalTramite || pagos.reduce((sum: number, p: any) => sum + Number(p.monto), 0))}</span>
          </div>
        </div>
      )}
    </div>
  );
}
