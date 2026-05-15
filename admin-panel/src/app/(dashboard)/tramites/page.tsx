'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, MoreHorizontal, Plus } from 'lucide-react';
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

const ESTATUS_BADGE: Record<string, { className: string; label: string }> = {
  borrador: { className: 'bg-gray-50 text-gray-700', label: 'Borrador' },
  recibido: { className: 'bg-blue-50 text-blue-700', label: 'Recibido' },
  en_revision: { className: 'bg-yellow-50 text-yellow-700', label: 'En revisión' },
  en_espera_resolucion: { className: 'bg-orange-50 text-orange-700', label: 'En espera' },
  aprobado: { className: 'bg-green-50 text-green-700', label: 'Aprobado' },
  rechazado: { className: 'bg-red-50 text-red-700', label: 'Rechazado' },
  cancelado: { className: 'bg-gray-50 text-gray-600', label: 'Cancelado' },
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
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trámites</h1>
        <Link
          href="/tramites/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Trámite
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, número de pieza o asesor..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              aria-label="Buscar trámites"
            />
          </div>

          {/* Estatus filter */}
          <select
            value={estatusFilter}
            onChange={(e) => {
              setEstatusFilter(e.target.value as EstatusFilter);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            aria-label="Filtrar por estatus"
          >
            {ESTATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Tipo filter */}
          <select
            value={tipoFilter}
            onChange={(e) => {
              setTipoFilter(e.target.value as TipoFilter);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            aria-label="Filtrar por tipo de trámite"
          >
            {TIPO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
          <p className="text-red-500 text-sm">Error al cargar trámites. Verifica tu conexión e intenta de nuevo.</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-36 hidden md:block" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-28 hidden lg:block" />
                <Skeleton className="h-5 w-24 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Nº Pieza</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">
                    Tipo
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Estatus</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">
                    Responsable
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">
                    Fecha
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tramites.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      No se encontraron trámites con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  tramites.map((tramite: Tramite) => {
                    const badge = ESTATUS_BADGE[tramite.estatus] ?? {
                      className: 'bg-gray-50 text-gray-700',
                      label: tramite.estatus,
                    };
                    const clienteName = tramite.cliente
                      ? `${tramite.cliente.nombre} ${tramite.cliente.apellidos}`
                      : '--';
                    return (
                      <tr key={tramite.id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/tramites/${tramite.id}`}
                            className="font-mono text-sm font-medium text-brand-600 hover:text-brand-700"
                          >
                            {tramite.numeroPieza ?? '—'}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{clienteName}</td>
                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                          {TIPO_LABELS[tramite.tipo] ?? tramite.tipo}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                          {tramite.responsable?.fullName ?? '--'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                          {tramite.createdAt ? new Date(tramite.createdAt).toLocaleDateString('es-MX') : '--'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/tramites/${tramite.id}`}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 text-gray-500"
                            aria-label={`Ver detalle del trámite ${tramite.numeroPieza ?? tramite.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                Mostrando {(currentPage - 1) * pageSize + 1} a{' '}
                {Math.min(currentPage * pageSize, total)} de {total} trámites
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-700 px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
