'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Search, FileText, Eye, ChevronLeft, ChevronRight, Filter, CheckCircle, X, Download, Printer } from 'lucide-react';
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
  pendiente: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  recibido: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  en_revision: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  aprobado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rechazado: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewDoc, setViewDoc] = useState<{ doc: DocItem; url: string; contentType: string } | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
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
      setLoadingDoc(true);
      const res = await api.get(`/documentos/${doc.id}/download`, { responseType: 'blob' });
      const contentType = String(res.headers['content-type'] || 'application/pdf');
      const blob = new Blob([res.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      setViewDoc({ doc, url, contentType });
    } catch { toast.error('Error al abrir el documento'); }
    finally { setLoadingDoc(false); }
  };

  const handleCloseModal = () => {
    if (viewDoc?.url) URL.revokeObjectURL(viewDoc.url);
    setViewDoc(null);
  };

  const handleDownload = () => {
    if (!viewDoc) return;
    const a = document.createElement('a');
    a.href = viewDoc.url;
    a.download = viewDoc.doc.nombre || 'documento';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (!viewDoc) return;
    const printWindow = window.open(viewDoc.url, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => { printWindow.print(); });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-neutral-900 via-stone-800 to-amber-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
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
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/70">Total Documentos</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200/30">
                <FolderOpen className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{total}</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/70">Aprobados</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/30">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{documentos.filter(d => d.estatus === 'aprobado').length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-amber-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/70">En esta página</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-amber-600 text-white shadow-lg shadow-blue-200/30">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{filteredDocs.length}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="dark-card-static p-5 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10"><Filter className="h-4 w-4 text-amber-600" /></div>
          <h2 className="text-lg font-bold text-white">Filtros</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
            <input
              type="text"
              placeholder="Buscar por nombre o categoría..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-[#3a3a3a] rounded-xl text-sm bg-[#222222] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={filtroEstatus}
            onChange={e => { setFiltroEstatus(e.target.value); setPage(1); }}
            className="px-4 py-3 border border-[#3a3a3a] rounded-xl text-sm text-white/70 bg-[#222222] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
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
      <div className="dark-card-static overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 px-6 py-4 border-b">
          <div className="p-2 rounded-lg bg-amber-500/10"><FolderOpen className="h-4 w-4 text-amber-600" /></div>
          <h2 className="text-lg font-bold text-white">Listado de Documentos</h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-[#1a1a1a]">
                <div className="h-10 w-10 rounded-xl bg-[#262626] animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-[#262626] rounded animate-pulse" />
                  <div className="h-3 w-56 bg-[#262626] rounded animate-pulse" />
                </div>
                <div className="h-6 w-20 bg-[#262626] rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-amber-400" />
            </div>
            <p className="text-white/70 font-medium">No se encontraron documentos</p>
            <p className="text-sm text-white/70 mt-1">Intenta con otros términos de búsqueda</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#262626]">
              {filteredDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#222222] transition-colors group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-11 w-11 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <FileText className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{doc.nombre}</p>
                      <p className="text-xs text-white/70">{doc.categoria || 'Sin categoría'} • {formatDate(doc.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${ESTATUS_BADGE[doc.estatus] || 'bg-[#1a1a1a] text-white/70 border-[#3a3a3a]'}`}>
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
              <div className="flex items-center justify-between px-6 py-4 border-t bg-gradient-to-r from-white/[0.02] to-white/[0.04]">
                <p className="text-sm text-white/70">Página {page} de {totalPages} (<span className="font-semibold text-white/70">{total}</span> documentos)</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border hover:bg-[#222222] disabled:opacity-50 transition-all"><ChevronLeft className="h-4 w-4" /></button>
                  <span className="text-sm font-medium text-white/70 px-3 py-1.5 bg-[#171717] rounded-lg border">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border hover:bg-[#222222] disabled:opacity-50 transition-all"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de visualización de documento */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleCloseModal}>
          <div className="bg-[#171717] rounded-2xl shadow-2xl w-full max-w-4xl mx-4 h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {/* Header del modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white truncate">{viewDoc.doc.nombre}</h2>
                  <p className="text-xs text-white/70">{viewDoc.doc.categoria || 'Sin categoría'} • {formatDate(viewDoc.doc.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white/70 bg-[#222222] rounded-xl hover:bg-[#262626] transition-colors"
                  title="Descargar"
                >
                  <Download className="h-4 w-4" /> Guardar
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:from-amber-600 hover:to-orange-700 shadow-sm transition-all"
                  title="Imprimir"
                >
                  <Printer className="h-4 w-4" /> Imprimir
                </button>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-xl hover:bg-[#222222] text-white/70 hover:text-white/70 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Contenido del documento */}
            <div className="flex-1 overflow-hidden bg-[#222222] rounded-b-2xl">
              {viewDoc.contentType.includes('pdf') ? (
                <iframe src={viewDoc.url} className="w-full h-full border-0" title={viewDoc.doc.nombre} />
              ) : viewDoc.contentType.includes('image') ? (
                <div className="w-full h-full flex items-center justify-center p-6 overflow-auto">
                  <img src={viewDoc.url} alt={viewDoc.doc.nombre} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center mb-4">
                    <FileText className="h-10 w-10 text-amber-500" />
                  </div>
                  <p className="text-white/70 font-medium mb-2">Vista previa no disponible</p>
                  <p className="text-sm text-white/70 mb-4">Tipo: {viewDoc.contentType}</p>
                  <button onClick={handleDownload} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:from-amber-600 hover:to-orange-700 shadow-lg transition-all">
                    <Download className="h-4 w-4" /> Descargar archivo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loadingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[#171717] rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            <p className="text-sm text-white/70 font-medium">Cargando documento...</p>
          </div>
        </div>
      )}
    </div>
  );
}
