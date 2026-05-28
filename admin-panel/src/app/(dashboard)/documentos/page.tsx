'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Search, FileText, Eye, ChevronLeft, ChevronRight, Filter, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface DocItem {
  id: string;
  nombre: string;
  categoria?: string;
  mimeType?: string;
  estatus: string;
  createdAt: string;
  tramiteId?: string;
  expedienteId?: string;
}

const ESTATUS_BADGE: Record<string, string> = {
  pendiente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  recibido: 'bg-blue-50 text-blue-700 border-blue-200',
  en_revision: 'bg-orange-50 text-orange-700 border-orange-200',
  aprobado: 'bg-green-50 text-green-700 border-green-200',
  rechazado: 'bg-red-50 text-red-700 border-red-200',
};

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => { fetchDocumentos(); }, [page, filtroEstatus]);

  const fetchDocumentos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documentos', { params: { page, limit, estatus: filtroEstatus || undefined } });
      const data = res.data?.data || res.data || [];
      setDocumentos(Array.isArray(data) ? data : []);
      setTotal(res.data?.meta?.total || res.data?.total || data.length);
    } catch { setDocumentos([]); }
    finally { setLoading(false); }
  };

  const filteredDocs = search
    ? documentos.filter(d => d.nombre.toLowerCase().includes(search.toLowerCase()) || d.categoria?.toLowerCase().includes(search.toLowerCase()))
    : documentos;

  const totalPages = Math.ceil(total / limit) || 1;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleView = async (doc: DocItem) => {
    try {
      const res = await api.get(`/documentos/${doc.id}/download`, { responseType: 'blob' });
      const contentType = String(res.headers['content-type'] || 'application/pdf');
      const blob = new Blob([res.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch { toast.error('Error al abrir el documento'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-stone-900 via-neutral-800 to-amber-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Documentos</h1>
            <p className="text-amber-200 mt-1">Todos los documentos subidos en el sistema</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{total}</p>
            <p className="text-amber-200 text-sm">Total documentos</p>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500">Total Documentos</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200/30">
                <FolderOpen className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{total}</p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500">Aprobados</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/30">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{documentos.filter(d => d.estatus === 'aprobado').length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500">En esta página</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200/30">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{filteredDocs.length}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-amber-50"><Filter className="h-4 w-4 text-amber-600" /></div>
          <h2 className="text-lg font-bold text-gray-900">Filtros</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o categoría..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={filtroEstatus}
            onChange={e => { setFiltroEstatus(e.target.value); setPage(1); }}
            className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
          >
            <option value="">Todos los estatus</option>
            <option value="pendiente">Pendiente</option>
            <option value="recibido">Recibido</option>
            <option value="en_revision">En revisión</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>
      </div>

      {/* Lista de documentos */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 px-6 py-4 border-b">
          <div className="p-2 rounded-lg bg-amber-50"><FolderOpen className="h-4 w-4 text-amber-600" /></div>
          <h2 className="text-lg font-bold text-gray-900">Listado de Documentos</h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                <div className="h-10 w-10 rounded-xl bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-56 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-amber-400" />
            </div>
            <p className="text-gray-500 font-medium">No se encontraron documentos</p>
            <p className="text-sm text-gray-400 mt-1">Intenta con otros términos de búsqueda</p>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {filteredDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-colors group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-11 w-11 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <FileText className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{doc.nombre}</p>
                      <p className="text-xs text-gray-500">{doc.categoria || 'Sin categoría'} • {formatDate(doc.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${ESTATUS_BADGE[doc.estatus] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {doc.estatus.replace(/_/g, ' ')}
                    </span>
                    <button
                      onClick={() => handleView(doc)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg hover:from-amber-600 hover:to-orange-700 shadow-sm transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-white">
                <p className="text-sm text-gray-500">Página {page} de {totalPages} (<span className="font-semibold text-gray-700">{total}</span> documentos)</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border hover:bg-white hover:shadow-sm disabled:opacity-50 transition-all"><ChevronLeft className="h-4 w-4" /></button>
                  <span className="text-sm font-medium text-gray-700 px-3 py-1.5 bg-white rounded-lg border">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border hover:bg-white hover:shadow-sm disabled:opacity-50 transition-all"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
