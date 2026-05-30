'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Eye, Trash2, Users, Globe, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { useClientes } from '@/hooks/use-clientes';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/lib/types';
import { api } from '@/lib/api';
import { capitalizeName } from '@/lib/utils';
import type { Cliente } from '@/lib/types';

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const { user } = useAuthStore();
  const isAdmin = user?.role === UserRole.ADMINISTRADOR;

  const { data, isLoading, isError, refetch } = useClientes({
    search: search || undefined,
    page: currentPage,
    limit: pageSize,
  });

  const clientes = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/clientes/${id}`);
      toast.success(`"${nombre}" eliminado correctamente`);
      refetch();
    } catch {
      toast.error('Error al eliminar el extranjero');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-bl from-stone-900 via-amber-900 to-amber-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Extranjeros</h1>
            <p className="text-amber-200 mt-1">Gestión de clientes extranjeros registrados</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{total}</p>
            <p className="text-blue-200 text-sm">Total registrados</p>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-amber-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/40">Total Extranjeros</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-amber-600 text-white shadow-lg shadow-blue-200/30">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{total}</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/40">Página Actual</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/30">
                <Globe className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{currentPage} <span className="text-lg text-white/30">/ {totalPages}</span></p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-500 to-amber-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/40">Mostrando</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-amber-600 text-white shadow-lg shadow-amber-500/20/30">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{clientes.length} <span className="text-lg text-white/30">registros</span></p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="dark-card-static p-5 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/10"><Search className="h-4 w-4 text-blue-400" /></div>
          <h2 className="text-lg font-bold text-white">Buscar Extranjeros</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-11 pr-4 py-3 border border-[#2a2a2a] rounded-xl text-sm bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            aria-label="Buscar clientes"
          />
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="dark-card-static p-8 text-center">
          <p className="text-red-500 text-sm">Error al cargar clientes. Verifica tu conexión e intenta de nuevo.</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="dark-card-static overflow-hidden p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-[#141414]">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de extranjeros */}
      {!isLoading && !isError && (
        <div className="dark-card-static overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 px-6 py-4 border-b">
            <div className="p-2 rounded-lg bg-blue-500/10"><Users className="h-4 w-4 text-blue-400" /></div>
            <h2 className="text-lg font-bold text-white">Listado de Extranjeros</h2>
          </div>

          {clientes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-white/40 font-medium">No se encontraron extranjeros</p>
              <p className="text-sm text-white/30 mt-1">Intenta con otros términos de búsqueda</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-[#262626]">
                {clientes.map((cliente: Cliente) => {
                  const nombreCompleto = capitalizeName(cliente.nombreCompleto) || '—';
                  return (
                    <div key={cliente.id} className="flex items-center justify-between px-6 py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <span className="text-sm font-bold text-blue-400">{nombreCompleto.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/clientes/${cliente.id}`}
                            className="text-sm font-semibold text-white hover:text-blue-400 capitalize truncate block transition-colors"
                          >
                            {nombreCompleto}
                          </Link>
                          <p className="text-xs text-white/40 truncate">
                            {cliente.email} {cliente.telefono && `• ${cliente.telefono}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {cliente.asesor?.fullName && (
                          <span className="hidden lg:inline-flex px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {cliente.asesor.fullName}
                          </span>
                        )}
                        {cliente.etiquetas?.length > 0 && (
                          <div className="hidden xl:flex gap-1">
                            {cliente.etiquetas.slice(0, 2).map((tag) => (
                              <span key={tag} className="inline-flex px-2 py-0.5 bg-[#1f1f1f] text-white/60 rounded-full text-[10px] font-medium">{tag}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/clientes/${cliente.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-amber-600 rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all"
                            aria-label={`Ver detalle de ${nombreCompleto}`}
                          >
                            <Eye className="h-3.5 w-3.5" /> Ver
                          </Link>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(cliente.id, nombreCompleto)}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-500 transition-colors"
                              aria-label={`Eliminar ${nombreCompleto}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gradient-to-r from-white/[0.02] to-white/[0.04]">
                  <p className="text-sm text-white/40">
                    Mostrando {(currentPage - 1) * pageSize + 1} a{' '}
                    {Math.min(currentPage * pageSize, total)} de <span className="font-semibold text-white/70">{total}</span> extranjeros
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border hover:bg-[#171717] hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium text-white/70 px-3 py-1.5 bg-[#171717] rounded-lg border">{currentPage} / {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl border hover:bg-[#171717] hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      aria-label="Página siguiente"
                    >
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
