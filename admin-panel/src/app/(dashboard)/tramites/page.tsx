'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, MoreHorizontal, Plus, FileText, Activity, Filter } from 'lucide-react';
import { useTramites } from '@/hooks/use-tramites';
import { Skeleton } from '@/components/ui/skeleton';
import { EstatusTramite, TipoTramite } from '@/lib/types';
import type { Tramite } from '@/lib/types';

type EstatusFilter = 'todos' | `${EstatusTramite}`;
type TipoFilter = 'todos' | `${TipoTramite}`;

const ESTATUS_OPTIONS: { value: EstatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos los estatus' },
  { value: EstatusTramite.BORRADOR, label: 'Borrador' },
  { value: EstatusTramite.RECIBIDO, label: 'Recibido' },
  { value: EstatusTramite.EN_REVISION, label: 'En revisión' },
  { value: EstatusTramite.EN_ESPERA_RESOLUCION, label: 'En espera' },
  { value: EstatusTramite.APROBADO, label: 'Aprobado' },
  { value: EstatusTramite.RECHAZADO, label: 'Rechazado' },
  { value: EstatusTramite.CANCELADO, label: 'Cancelado' },
];

const TIPO_OPTIONS: { value: TipoFilter; label: string }[] = [
  { value: 'todos', label: 'Todos los tipos' },
  { value: TipoTramite.RESIDENCIA_TEMPORAL, label: 'Residencia Temporal' },
  { value: TipoTramite.RESIDENCIA_PERMANENTE, label: 'Residencia Permanente' },
  { value: TipoTramite.REGULARIZACION, label: 'Regularización' },
  { value: TipoTramite.CAMBIO_CONDICION, label: 'Cambio de Condición' },
  { value: TipoTramite.VISA, label: 'Visa' },
  { value: TipoTramite.NACIONALIDAD, label: 'Nacionalidad' },
  { value: TipoTramite.PERMISO_TRABAJO, label: 'Permiso de Trabajo' },
  { value: TipoTramite.RENOVACION, label: 'Renovación' },
  { value: TipoTramite.CAMBIO_DOMICILIO, label: 'Cambio de Domicilio' },
  { value: TipoTramite.REPOSICION_DOCUMENTO, label: 'Reposición de Documento' },
  { value: TipoTramite.CAMBIO_NACIONALIDAD, label: 'Cambio de Nacionalidad' },
];

const ESTATUS_BADGE: Record<string, { className: string; label: string; gradient: string }> = {
  borrador: { className: 'bg-[#1a1a1a] text-white/70 border-[#3a3a3a]', label: 'Borrador', gradient: 'from-gray-400 to-gray-500' },
  recibido: { className: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Recibido', gradient: 'from-blue-400 to-amber-600' },
  en_revision: { className: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'En revisión', gradient: 'from-yellow-400 to-amber-500' },
  en_espera_resolucion: { className: 'bg-orange-500/10 text-orange-400 border-orange-500/20', label: 'En espera', gradient: 'from-orange-400 to-orange-600' },
  aprobado: { className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Aprobado', gradient: 'from-green-400 to-emerald-600' },
  rechazado: { className: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Rechazado', gradient: 'from-red-400 to-red-600' },
  cancelado: { className: 'bg-[#1a1a1a] text-white/70 border-[#3a3a3a]', label: 'Cancelado', gradient: 'from-gray-300 to-gray-500' },
};

const TIPO_LABELS: Record<string, string> = {
  residencia_temporal: 'Residencia Temporal',
  residencia_permanente: 'Residencia Permanente',
  regularizacion: 'Regularización',
  cambio_condicion_migratoria: 'Cambio de Condición',
  visa: 'Visa',
  nacionalidad: 'Nacionalidad',
  permiso_trabajo: 'Permisos INM',
  notificacion_cambio: 'Notificación de Cambio',
  expedicion_documento: 'Expedición Documento',
  regularizacion_migratoria: 'Regularización Migratoria',
  constancia_empleador: 'CIE',
  cambio_condicion_estancia: 'Cambio de Condición',
  renovacion: 'Renovación',
  cambio_domicilio: 'Cambio de Domicilio',
  reposicion_documento: 'Reposición de Documento',
  cambio_nacionalidad: 'Cambio de Nacionalidad',
};

export default function TramitesPage() {
  const [search, setSearch] = useState('');
  const [estatusFilter, setEstatusFilter] = useState<EstatusFilter>('todos');
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, isError } = useTramites({
    estatus: estatusFilter === 'todos' ? undefined : (estatusFilter as EstatusTramite),
    tipo: tipoFilter === 'todos' ? undefined : (tipoFilter as TipoTramite),
    page: currentPage,
    limit: pageSize,
  });

  const tramites = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-neutral-900 via-stone-800 to-amber-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trámites</h1>
            <p className="text-amber-200 mt-1">Gestión de trámites migratorios</p>
          </div>
          <Link
            href="/tramites/nuevo"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#222222] backdrop-blur-sm text-white rounded-xl text-sm font-semibold hover:bg-[#171717]/30 transition-all border border-white/20"
          >
            <Plus className="h-4 w-4" /> Iniciar Trámite
          </Link>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500 to-amber-600 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/70">Total Trámites</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20/30">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{total}</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-amber-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/70">En Proceso</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-amber-600 text-white shadow-lg shadow-blue-200/30">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{tramites.filter(t => ['recibido', 'en_revision', 'en_espera_resolucion'].includes(t.estatus)).length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/70">Página</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/30">
                <Filter className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{currentPage} <span className="text-lg text-white/70">/ {totalPages}</span></p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="dark-card-static p-5 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10"><Filter className="h-4 w-4 text-amber-500" /></div>
          <h2 className="text-lg font-bold text-white">Filtros</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
            <input
              type="text"
              placeholder="Buscar por cliente, número de pieza o gestor..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-3 border border-[#3a3a3a] rounded-xl text-sm bg-[#222222] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              aria-label="Buscar trámites"
            />
          </div>
          <select
            value={estatusFilter}
            onChange={(e) => { setEstatusFilter(e.target.value as EstatusFilter); setCurrentPage(1); }}
            className="px-4 py-3 border border-[#3a3a3a] rounded-xl text-sm text-white/70 bg-[#222222] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            aria-label="Filtrar por estatus"
          >
            {ESTATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select
            value={tipoFilter}
            onChange={(e) => { setTipoFilter(e.target.value as TipoFilter); setCurrentPage(1); }}
            className="px-4 py-3 border border-[#3a3a3a] rounded-xl text-sm text-white/70 bg-[#222222] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            aria-label="Filtrar por tipo de trámite"
          >
            {TIPO_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="dark-card-static p-8 text-center">
          <p className="text-red-500 text-sm">Error al cargar trámites. Verifica tu conexión e intenta de nuevo.</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="dark-card-static overflow-hidden p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-[#1a1a1a]">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de trámites */}
      {!isLoading && !isError && (
        <div className="dark-card-static overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 px-6 py-4 border-b">
            <div className="p-2 rounded-lg bg-amber-500/10"><FileText className="h-4 w-4 text-amber-500" /></div>
            <h2 className="text-lg font-bold text-white">Listado de Trámites</h2>
          </div>

          {tramites.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/15 to-amber-600/15 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-amber-400/70" />
              </div>
              <p className="text-white/70 font-medium">No se encontraron trámites</p>
              <p className="text-sm text-white/70 mt-1">Intenta con otros filtros o inicia un nuevo trámite</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-[#262626]">
                {tramites.map((tramite: Tramite) => {
                  const badge = ESTATUS_BADGE[tramite.estatus] ?? { className: 'bg-[#1a1a1a] text-white/70 border-[#3a3a3a]', label: tramite.estatus, gradient: 'from-gray-400 to-gray-500' };
                  const clienteName = tramite.cliente
                    ? (tramite.cliente.nombreCompleto || `${tramite.cliente.nombre || ''} ${tramite.cliente.apellidos || ''}`.trim() || '--')
                    : (tramite.datosFormulario?.nombre ? `${tramite.datosFormulario.nombre} ${tramite.datosFormulario.apellidos || ''}`.trim() : '--');
                  return (
                    <div key={tramite.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#222222] transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-600/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <FileText className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Link href={`/tramites/${tramite.id}`} className="font-mono text-sm font-semibold text-amber-500 hover:text-amber-400 transition-colors">
                              {tramite.numeroPieza ?? '—'}
                            </Link>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}>
                              {badge.label}
                            </span>
                            {/* Indicador de origen */}
                            {((tramite.datosFormulario as any)?.origenApp || (tramite.numeroPieza?.startsWith('MSX-') && !(tramite.datosFormulario as any)?.etapaGestion)) ? (
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">📱 App</span>
                            ) : (
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">🖥 Admin</span>
                            )}
                          </div>
                          <p className="text-sm text-white capitalize truncate">{clienteName}</p>
                          <p className="text-xs text-white/70">
                            {TIPO_LABELS[tramite.tipo] ?? tramite.tipo}
                            {(tramite as any).asesor?.fullName && ` • ${(tramite as any).asesor.fullName}`}
                            {tramite.createdAt && ` • ${new Date(tramite.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`}
                            {(tramite.datosFormulario as any)?.ubicacionOrigen?.ciudad && (
                              <span className="text-[10px] text-white/70 ml-2">📍 {(tramite.datosFormulario as any).ubicacionOrigen.ciudad}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {(tramite.datosFormulario as any)?.etapaGestion !== 'finalizado' && (tramite.estatus === 'recibido' || tramite.estatus === 'borrador' || (tramite.estatus === 'en_revision' && (tramite.datosFormulario as any)?.etapaGestion && (tramite.datosFormulario as any).etapaGestion !== 'finalizado')) && (
                          <Link href={`/tramites/continuar/${tramite.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-sm transition-all">
                            Continuar
                          </Link>
                        )}
                        <Link href={`/tramites/${tramite.id}`} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-[#222222] text-white/70 transition-colors" aria-label={`Ver detalle del trámite ${tramite.numeroPieza ?? tramite.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gradient-to-r from-white/[0.02] to-white/[0.04]">
                  <p className="text-sm text-white/70">
                    Mostrando {(currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, total)} de <span className="font-semibold text-white/70">{total}</span> trámites
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl border hover:bg-[#222222] disabled:opacity-50 disabled:cursor-not-allowed transition-all" aria-label="Página anterior">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium text-white/70 px-3 py-1.5 bg-[#171717] rounded-lg border">{currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl border hover:bg-[#222222] disabled:opacity-50 disabled:cursor-not-allowed transition-all" aria-label="Página siguiente">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
