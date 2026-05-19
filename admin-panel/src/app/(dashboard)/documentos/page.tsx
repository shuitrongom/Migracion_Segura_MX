'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Search, FileText, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
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

  useEffect(() => {
    fetchDocumentos();
  }, [page, filtroEstatus]);

  const fetchDocumentos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documentos', { params: { page, limit, estatus: filtroEstatus || undefined } });
      const data = res.data?.data || res.data || [];
      setDocumentos(Array.isArray(data) ? data : []);
      setTotal(res.data?.meta?.total || res.data?.total || data.length);
    } catch {
      setDocumentos([]);
    } finally {
      setLoading(false);
    }
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
    } catch {
      toast.error('Error al abrir el documento');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-brand-500 to-amber-500 rounded-xl flex items-center justify-center shadow-sm">
            <FolderOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
            <p className="text-xs text-gray-500">Todos los documentos subidos en el sistema</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-brand-600">{total}</p>
          <p className="text-[10px] text-gray-400 uppercase">Total documentos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o categoría..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 bg-gray-50/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            />
          </div>
          <select
            value={filtroEstatus}
            onChange={e => { setFiltroEstatus(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-300 bg-gray-50/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
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

      {/* Lista */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando documentos...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron documentos.</p>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {filteredDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 bg-gradient-to-br from-brand-100 to-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-brand-600" />
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg hover:from-brand-600 hover:to-brand-700 shadow-sm transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50">
                <p className="text-xs text-gray-500">Página {page} de {totalPages} ({total} documentos)</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border hover:bg-white disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border hover:bg-white disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
