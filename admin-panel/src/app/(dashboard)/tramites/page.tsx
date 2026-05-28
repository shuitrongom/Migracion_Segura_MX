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
  borrador: { className: 'bg-gray-50 text-gray-700 border-gray-200', label: 'Borrador', gradient: 'from-gray-400 to-gray-500' },
  recibido: { className: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Recibido', gradient: 'from-blue-400 to-blue-600' },
  en_revision: { className: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'En revisión', gradient: 'from-yellow-400 to-amber-500' },
  en_espera_resolucion: { className: 'bg-orange-50 text-orange-700 border-orange-200', label: 'En espera', gradient: 'from-orange-400 to-orange-600' },
  aprobado: { className: 'bg-green-50 text-green-700 border-green-200', label: 'Aprobado', gradient: 'from-green-400 to-emerald-600' },
  rechazado: { className: 'bg-red-50 text-red-700 border-red-200', label: 'Rechazado', gradient: 'from-red-400 to-red-600' },
  cancelado: { className: 'bg-gray-50 text-gray-600 border-gray-200', label: 'Cancelado', gradient: 'from-gray-300 to-gray-500' },
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-amber-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trámites</h1>
            <p className="text-brand-200 mt-1">Gestión de trámites migratorios</p>
          </div>
          <Link
            href="/tramites/nuevo"
            className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-semibold hover:bg-white/30 transition-all border border-white/20"
          >
            <Plus className="h-4 w-4" /> Iniciar Trámite
          </Link>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-500 to-amber-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500">Total Trámites</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-amber-600 text-white shadow-lg shadow-brand-200/30">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{total}</p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500">En Proceso</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200/30">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{tramites.filter(t => ['recibido', 'en_revision', 'en_espera_resolucion'].includes(t.estatus)).length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500">Página</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/30">
                <Filter className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{currentPage} <span className="text-lg text-gray-400">/ {totalPages}</span></p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-brand-50"><Filter className="h-4 w-4 text-brand-600" /></div>
          <h2 className="text-lg font-bold text-gray-900">Filtros</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, número de pieza o gestor..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              aria-label="Buscar trámites"
            />
          </div>
          <select
            value={estatusFilter}
            onChange={(e) => { setEstatusFilter(e.target.value as EstatusFilter); setCurrentPage(1); }}
            className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            aria-label="Filtrar por estatus"
          >
            {ESTATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select
            value={tipoFilter}
            onChange={(e) => { setTipoFilter(e.target.value as TipoFilter); setCurrentPage(1); }}
            className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            aria-label="Filtrar por tipo de trámite"
          >
            {TIPO_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="bg-white rounded-2xl border shadow-sm p-8 text-center">
          <p className="text-red-500 text-sm">Error al cargar trámites. Verifica tu conexión e intenta de nuevo.</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
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
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 px-6 py-4 border-b">
            <div className="p-2 rounded-lg bg-brand-50"><FileText className="h-4 w-4 text-brand-600" /></div>
            <h2 className="text-lg font-bold text-gray-900">Listado de Trámites</h2>
          </div>

          {tramites.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-100 to-amber-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-brand-400" />
              </div>
              <p className="text-gray-500 font-medium">No se encontraron trámites</p>
              <p className="text-sm text-gray-400 mt-1">Intenta con otros filtros o inicia un nuevo trámite</p>
            </div>
          ) : (
            <>
              <div className="divide-y">
                {tramites.map((tramite: Tramite) => {
                  const badge = ESTATUS_BADGE[tramite.estatus] ?? { className: 'bg-gray-50 text-gray-700 border-gray-200', label: tramite.estatus, gradient: 'from-gray-400 to-gray-500' };
                  const clienteName = tramite.cliente
                    ? (tramite.cliente.nombreCompleto || `${tramite.cliente.nombre || ''} ${tramite.cliente.apellidos || ''}`.trim() || '--')
                    : (tramite.datosFormulario?.nombre ? `${tramite.datosFormulario.nombre} ${tramite.datosFormulario.apellidos || ''}`.trim() : '--');
                  return (
                    <div key={tramite.id} className="flex items-center justify-between px-6 py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-100 to-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <FileText className="h-5 w-5 text-brand-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Link href={`/tramites/${tramite.id}`} className="font-mono text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                              {tramite.numeroPieza ?? '—'}
                            </Link>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}>
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 capitalize truncate">{clienteName}</p>
                          <p className="text-xs text-gray-500">
                            {TIPO_LABELS[tramite.tipo] ?? tramite.tipo}
                            {(tramite as any).asesor?.fullName && ` • ${(tramite as any).asesor.fullName}`}
                            {tramite.createdAt && ` • ${new Date(tramite.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {(!tramite.numeroPieza || tramite.numeroPieza.startsWith('MSX-')) && (
                          <Link href={`/tramites/continuar/${tramite.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-sm transition-all">
                            Continuar
                          </Link>
                        )}
                        <Link href={`/tramites/${tramite.id}`} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" aria-label={`Ver detalle del trámite ${tramite.numeroPieza ?? tramite.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-white">
                  <p className="text-sm text-gray-500">
                    Mostrando {(currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, total)} de <span className="font-semibold text-gray-700">{total}</span> trámites
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl border hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all" aria-label="Página anterior">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium text-gray-700 px-3 py-1.5 bg-white rounded-lg border">{currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl border hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all" aria-label="Página siguiente">
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
