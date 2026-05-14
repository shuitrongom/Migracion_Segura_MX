'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useClientes } from '@/hooks/use-clientes';
import { Skeleton } from '@/components/ui/skeleton';
import type { Cliente } from '@/lib/types';

const ESTATUS_BADGE: Record<string, { bg: string; text: string }> = {
  en_proceso: { bg: 'bg-blue-50 text-blue-700', text: 'En proceso' },
  en_revision: { bg: 'bg-yellow-50 text-yellow-700', text: 'En revisión' },
  aprobado: { bg: 'bg-green-50 text-green-700', text: 'Aprobado' },
  rechazado: { bg: 'bg-red-50 text-red-700', text: 'Rechazado' },
};

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, isError } = useClientes({
    search: search || undefined,
    page: currentPage,
    limit: pageSize,
  });

  const clientes = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Link
          href="/clientes/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Cliente
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
              placeholder="Buscar por nombre, email, teléfono o pieza..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              aria-label="Buscar clientes"
            />
          </div>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
          <p className="text-red-500 text-sm">Error al cargar clientes. Verifica tu conexión e intenta de nuevo.</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-32 hidden md:block" />
                <Skeleton className="h-5 w-28 hidden lg:block" />
                <Skeleton className="h-5 w-20" />
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
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">
                    Teléfono
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">
                    Asesor
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">
                    Etiquetas
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      No se encontraron clientes con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente: Cliente) => {
                    const nombreCompleto = `${cliente.nombre} ${cliente.apellidos}`;
                    return (
                      <tr key={cliente.id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/clientes/${cliente.id}`}
                            className="font-medium text-gray-900 hover:text-brand-600"
                          >
                            {nombreCompleto}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{cliente.email}</td>
                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                          {cliente.telefono}
                        </td>
                        <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                          {cliente.asesor?.fullName ?? '--'}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {cliente.etiquetas.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/clientes/${cliente.id}`}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 text-gray-500"
                            aria-label={`Ver detalle de ${nombreCompleto}`}
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
                {Math.min(currentPage * pageSize, total)} de {total} clientes
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
