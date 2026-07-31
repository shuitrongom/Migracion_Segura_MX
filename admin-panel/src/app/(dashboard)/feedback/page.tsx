'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bug, Lightbulb, HelpCircle, MessageSquare, RefreshCw, ChevronLeft, ChevronRight, Star, CheckCircle, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Tipos ─────────────────────────────────────────────────────────────────────

type FeedbackTipo = 'error' | 'sugerencia' | 'confusion' | 'otro';
type FeedbackEstatus = 'nuevo' | 'revisado' | 'en_proceso' | 'resuelto' | 'descartado';
type FeedbackPrioridad = 'baja' | 'media' | 'alta' | 'critica';

interface FeedbackItem {
  id: string;
  tipo: FeedbackTipo;
  pantalla: string | null;
  descripcion: string;
  pasosReproduccion: string | null;
  rating: number | null;
  prioridad: FeedbackPrioridad;
  estatus: FeedbackEstatus;
  deviceInfo: { platform: string; osVersion: string; appVersion: string; model?: string } | null;
  notasAdmin: string | null;
  createdAt: string;
  cliente: { id: string; fullName?: string; email: string } | null;
}

interface FeedbackStats {
  total: number;
  nuevos: number;
  porTipo: Record<string, number>;
  porEstatus: Record<string, number>;
  porPrioridad: Record<string, number>;
  ratingPromedio: number | null;
}

// ─── Helpers visuales ──────────────────────────────────────────────────────────

const TIPO_META: Record<FeedbackTipo, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  error:      { label: 'Error',       icon: <Bug className="h-3.5 w-3.5" />,          color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
  sugerencia: { label: 'Sugerencia',  icon: <Lightbulb className="h-3.5 w-3.5" />,    color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  confusion:  { label: 'Confusión',   icon: <HelpCircle className="h-3.5 w-3.5" />,   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  otro:       { label: 'Otro',        icon: <MessageSquare className="h-3.5 w-3.5" />, color: 'text-white/50',   bg: 'bg-white/5 border-white/10' },
};

const PRIORIDAD_META: Record<FeedbackPrioridad, { label: string; color: string; dot: string }> = {
  critica: { label: 'Crítica', color: 'text-red-400',    dot: 'bg-red-500' },
  alta:    { label: 'Alta',    color: 'text-orange-400', dot: 'bg-orange-500' },
  media:   { label: 'Media',   color: 'text-amber-400',  dot: 'bg-amber-500' },
  baja:    { label: 'Baja',    color: 'text-green-400',  dot: 'bg-green-500' },
};

const ESTATUS_META: Record<FeedbackEstatus, { label: string; color: string; bg: string }> = {
  nuevo:      { label: 'Nuevo',      color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  revisado:   { label: 'Revisado',   color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  en_proceso: { label: 'En proceso', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  resuelto:   { label: 'Resuelto',   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  descartado: { label: 'Descartado', color: 'text-white/30',   bg: 'bg-white/5 border-white/10' },
};

function StarRating({ value }: { value: number | null }) {
  if (!value) return <span className="text-white/30 text-xs">—</span>;
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-3 w-3 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />
      ))}
    </span>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function FeedbackPage() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  const [filtroTipo, setFiltroTipo] = useState<FeedbackTipo | ''>('');
  const [filtroEstatus, setFiltroEstatus] = useState<FeedbackEstatus | ''>('');
  const [filtroPrioridad, setFiltroPrioridad] = useState<FeedbackPrioridad | ''>('');

  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notasEdit, setNotasEdit] = useState('');

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const { data } = await api.get('/feedback/stats');
      setStats(data);
    } catch { /* silencioso */ }
    setLoadingStats(false);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      if (filtroTipo) params.set('tipo', filtroTipo);
      if (filtroEstatus) params.set('estatus', filtroEstatus);
      if (filtroPrioridad) params.set('prioridad', filtroPrioridad);
      const { data } = await api.get(`/feedback?${params}`);
      setItems(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch { toast.error('Error al cargar reportes'); }
    setLoading(false);
  }, [page, filtroTipo, filtroEstatus, filtroPrioridad]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleUpdate = async (id: string, patch: Partial<{ estatus: FeedbackEstatus; prioridad: FeedbackPrioridad; notasAdmin: string }>) => {
    setUpdatingId(id);
    try {
      const { data } = await api.patch(`/feedback/${id}`, patch);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
      if (selected?.id === id) setSelected((s) => s ? { ...s, ...data } : s);
      toast.success('Reporte actualizado');
      fetchStats();
    } catch { toast.error('Error al actualizar'); }
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-neutral-900 via-stone-800 to-amber-700 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bug className="h-8 w-8 text-amber-300" /> Reportes de App
            </h1>
            <p className="text-amber-200 mt-1 text-sm">Retroalimentación recibida directamente desde la app móvil</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{stats?.nuevos ?? '—'}</p>
            <p className="text-amber-200 text-sm">Nuevos sin revisar</p>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total reportes', value: stats?.total, icon: <MessageSquare className="h-5 w-5" />, grad: 'from-blue-500 to-indigo-600' },
          { label: 'Errores',        value: stats?.porTipo?.error ?? 0, icon: <Bug className="h-5 w-5" />, grad: 'from-red-500 to-rose-600' },
          { label: 'Sugerencias',    value: stats?.porTipo?.sugerencia ?? 0, icon: <Lightbulb className="h-5 w-5" />, grad: 'from-amber-500 to-orange-500' },
          { label: 'Rating prom.',   value: stats?.ratingPromedio ? `${stats.ratingPromedio} ★` : '—', icon: <Star className="h-5 w-5" />, grad: 'from-green-500 to-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="relative overflow-hidden dark-card-static p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.grad} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-white/60">{s.label}</p>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${s.grad} text-white shadow-lg`}>{s.icon}</div>
              </div>
              {loadingStats ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-white">{s.value ?? '—'}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="dark-card-static p-5 flex flex-wrap gap-3 items-center">
        <p className="text-sm font-semibold text-white/70 mr-2">Filtrar:</p>
        {/* Tipo */}
        <select value={filtroTipo} onChange={(e) => { setFiltroTipo(e.target.value as any); setPage(1); }}
          className="bg-[#222] border border-[#3a3a3a] text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500">
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {/* Estatus */}
        <select value={filtroEstatus} onChange={(e) => { setFiltroEstatus(e.target.value as any); setPage(1); }}
          className="bg-[#222] border border-[#3a3a3a] text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500">
          <option value="">Todos los estatus</option>
          {Object.entries(ESTATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {/* Prioridad */}
        <select value={filtroPrioridad} onChange={(e) => { setFiltroPrioridad(e.target.value as any); setPage(1); }}
          className="bg-[#222] border border-[#3a3a3a] text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500">
          <option value="">Todas las prioridades</option>
          {Object.entries(PRIORIDAD_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={() => { setFiltroTipo(''); setFiltroEstatus(''); setFiltroPrioridad(''); setPage(1); }}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#3a3a3a] text-white/60 hover:text-white text-sm transition-colors">
          <RefreshCw className="h-3.5 w-3.5" /> Limpiar
        </button>
      </div>

      {/* ── Tabla de reportes ── */}
      <div className="dark-card-static overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-[#262626]">
          <div className="p-2 rounded-lg bg-red-500/10"><Bug className="h-4 w-4 text-red-400" /></div>
          <h2 className="text-lg font-bold text-white">Reportes recibidos</h2>
          <span className="ml-auto text-xs text-white/40">{total} total</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-[#1a1a1a]">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-64" /><Skeleton className="h-3 w-48" /></div>
                <Skeleton className="h-6 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <Bug className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 font-medium">No hay reportes con estos filtros</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#1e1e1e]">
              {items.map((item) => {
                const tipo = TIPO_META[item.tipo];
                const prioridad = PRIORIDAD_META[item.prioridad];
                const estatus = ESTATUS_META[item.estatus];
                return (
                  <div key={item.id}
                    className="flex items-start gap-4 px-6 py-4 hover:bg-[#141414] transition-colors cursor-pointer group"
                    onClick={() => { setSelected(item); setNotasEdit(item.notasAdmin ?? ''); }}>
                    {/* Tipo badge */}
                    <span className={`mt-0.5 inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold shrink-0 ${tipo.color} ${tipo.bg}`}>
                      {tipo.icon}{tipo.label}
                    </span>
                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{item.descripcion}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {item.pantalla && <span className="mr-2">📱 {item.pantalla}</span>}
                        {item.cliente?.email ?? 'Sin usuario'}
                        {item.deviceInfo && <span className="ml-2 opacity-60">· {item.deviceInfo.platform} {item.deviceInfo.appVersion}</span>}
                        <span className="ml-2 opacity-40">· {new Date(item.createdAt).toLocaleDateString('es-MX')}</span>
                      </p>
                    </div>
                    {/* Rating */}
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${estatus.color} ${estatus.bg}`}>
                        {estatus.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${prioridad.dot}`} />
                        <span className={`text-[10px] font-medium ${prioridad.color}`}>{prioridad.label}</span>
                      </span>
                      <StarRating value={item.rating} />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#262626]">
                <p className="text-xs text-white/40">Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-2 rounded-xl border border-[#3a3a3a] hover:bg-[#222] disabled:opacity-30 transition-all">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-white/50 px-2">{page} / {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-2 rounded-xl border border-[#3a3a3a] hover:bg-[#222] disabled:opacity-30 transition-all">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Drawer de detalle ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-lg h-full bg-[#111] border-l border-[#2a2a2a] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] sticky top-0 bg-[#111] z-10">
              <div className="flex items-center gap-2">
                <span className={`text-lg`}>{TIPO_META[selected.tipo].icon}</span>
                <h3 className="font-bold text-white">{TIPO_META[selected.tipo].label}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-white/5 text-white/50">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1a1a1a] rounded-xl p-3">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Prioridad</p>
                  <span className={`flex items-center gap-1.5 font-semibold text-sm ${PRIORIDAD_META[selected.prioridad].color}`}>
                    <span className={`w-2 h-2 rounded-full ${PRIORIDAD_META[selected.prioridad].dot}`} />
                    {PRIORIDAD_META[selected.prioridad].label}
                  </span>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-3">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Calificación</p>
                  <StarRating value={selected.rating} />
                </div>
                {selected.pantalla && (
                  <div className="bg-[#1a1a1a] rounded-xl p-3">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Pantalla</p>
                    <p className="text-sm text-white font-medium">📱 {selected.pantalla}</p>
                  </div>
                )}
                {selected.deviceInfo && (
                  <div className="bg-[#1a1a1a] rounded-xl p-3">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Dispositivo</p>
                    <p className="text-xs text-white/70">{selected.deviceInfo.platform} {selected.deviceInfo.osVersion}</p>
                    <p className="text-xs text-white/40">{selected.deviceInfo.model} · v{selected.deviceInfo.appVersion}</p>
                  </div>
                )}
              </div>

              {/* Usuario */}
              {selected.cliente && (
                <div className="bg-[#1a1a1a] rounded-xl p-4">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Extranjero</p>
                  <p className="text-sm font-semibold text-white">{selected.cliente.fullName ?? '—'}</p>
                  <p className="text-xs text-white/50">{selected.cliente.email}</p>
                </div>
              )}

              {/* Descripción */}
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Descripción</p>
                <p className="text-sm text-white/90 leading-relaxed bg-[#1a1a1a] rounded-xl p-4">{selected.descripcion}</p>
              </div>

              {/* Pasos */}
              {selected.pasosReproduccion && (
                <div>
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Pasos para reproducir</p>
                  <p className="text-sm text-white/80 leading-relaxed bg-[#1a1a1a] rounded-xl p-4 whitespace-pre-line">{selected.pasosReproduccion}</p>
                </div>
              )}

              {/* Cambiar estatus */}
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Estatus</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ESTATUS_META) as FeedbackEstatus[]).map((s) => (
                    <button key={s}
                      onClick={() => handleUpdate(selected.id, { estatus: s })}
                      disabled={updatingId === selected.id}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${selected.estatus === s ? `${ESTATUS_META[s].color} ${ESTATUS_META[s].bg} scale-105` : 'border-[#3a3a3a] text-white/40 hover:text-white hover:border-[#555]'}`}>
                      {ESTATUS_META[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas admin */}
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Notas internas</p>
                <textarea
                  value={notasEdit}
                  onChange={(e) => setNotasEdit(e.target.value)}
                  placeholder="Agregar notas del equipo técnico..."
                  rows={3}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
                <button
                  onClick={() => handleUpdate(selected.id, { notasAdmin: notasEdit })}
                  disabled={updatingId === selected.id}
                  className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
                  {updatingId === selected.id ? <Clock className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Guardar notas
                </button>
              </div>

              <p className="text-[10px] text-white/25 text-center">
                Recibido el {new Date(selected.createdAt).toLocaleString('es-MX')}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
