'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Search, FileText, Eye, ChevronDown, ChevronRight, User, Download, Printer, X, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Cliente {
  id: string;
  nombreCompleto?: string;
  nombre?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
}

interface DocItem {
  id: string;
  nombre: string;
  categoria?: string;
  mimeType?: string;
  estatus: string;
  createdAt: string;
  tramiteId?: string;
}

const CATEGORIA_LABELS: Record<string, string> = {
  solicitud: '📋 Solicitud',
  identificacion: '🪪 Identificación',
  comprobante: '📄 Comprobante',
  nut: '🔢 NUT',
  pasaporte: '🛂 Pasaporte',
  fotografia: '📷 Fotografía',
  acta: '📜 Acta',
  constancia: '📃 Constancia',
  otro: '📎 Otro',
};

const ESTATUS_BADGE: Record<string, string> = {
  pendiente: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  recibido: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  en_revision: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  aprobado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rechazado: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function ExpedienteDigitalPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedCliente, setExpandedCliente] = useState<string | null>(null);
  const [clienteDocs, setClienteDocs] = useState<Record<string, DocItem[]>>({});
  const [loadingDocs, setLoadingDocs] = useState<string | null>(null);
  const [viewDoc, setViewDoc] = useState<{ doc: DocItem; url: string; contentType: string } | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clientes');
      const data = res.data?.data || res.data || [];
      const allClientes: Cliente[] = Array.isArray(data) ? data : [];
      
      // Pre-cargar documentos de cada cliente para saber cuáles tienen
      const clientesConDocs: Cliente[] = [];
      const docsMap: Record<string, DocItem[]> = {};
      
      await Promise.all(allClientes.map(async (cliente) => {
        try {
          const docsRes = await api.get(`/documentos?clienteId=${cliente.id}`);
          const docs = docsRes.data?.data || docsRes.data || [];
          if (Array.isArray(docs) && docs.length > 0) {
            clientesConDocs.push(cliente);
            docsMap[cliente.id] = docs;
          }
        } catch {}
      }));
      
      setClientes(clientesConDocs);
      setClienteDocs(docsMap);
    } catch {
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocsByCliente = async (clienteId: string) => {
    if (clienteDocs[clienteId]) return;
    try {
      setLoadingDocs(clienteId);
      const res = await api.get(`/documentos?clienteId=${clienteId}`);
      const docs = res.data?.data || res.data || [];
      setClienteDocs(prev => ({ ...prev, [clienteId]: Array.isArray(docs) ? docs : [] }));
    } catch {
      setClienteDocs(prev => ({ ...prev, [clienteId]: [] }));
    } finally {
      setLoadingDocs(null);
    }
  };

  const handleToggleCliente = (clienteId: string) => {
    if (expandedCliente === clienteId) {
      setExpandedCliente(null);
    } else {
      setExpandedCliente(clienteId);
      fetchDocsByCliente(clienteId);
    }
  };

  const getClienteName = (c: Cliente) => c.nombreCompleto || `${c.nombre || ''} ${c.apellidos || ''}`.trim() || 'Sin nombre';

  const filteredClientes = search
    ? clientes.filter(c => {
        const name = getClienteName(c).toLowerCase();
        const email = (c.email || '').toLowerCase();
        return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
      })
    : clientes;

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

  const groupByCategoria = (docs: DocItem[]) => {
    const groups: Record<string, DocItem[]> = {};
    docs.forEach(doc => {
      const cat = doc.categoria || 'otro';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(doc);
    });
    return groups;
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
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-neutral-900 via-stone-800 to-amber-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Expediente Digital</h1>
            <p className="text-amber-200 mt-1">Documentos organizados por extranjero</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{clientes.length}</p>
            <p className="text-amber-200 text-sm">Extranjeros</p>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="dark-card-static p-5 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10"><Filter className="h-4 w-4 text-amber-600" /></div>
          <h2 className="text-lg font-bold text-white">Buscar extranjero</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-[#3a3a3a] rounded-xl text-sm bg-[#222222] text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Lista de extranjeros */}
      <div className="space-y-3">
        {loading ? (
          <div className="dark-card-static p-6">
            <div className="space-y-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1a1a]">
                  <div className="h-12 w-12 rounded-full bg-[#262626] animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-[#262626] rounded animate-pulse" />
                    <div className="h-3 w-32 bg-[#262626] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="dark-card-static p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-amber-400" />
            </div>
            <p className="text-white/70 font-medium">No se encontraron extranjeros</p>
            <p className="text-sm text-white/70 mt-1">Intenta con otros términos de búsqueda</p>
          </div>
        ) : (
          filteredClientes.map(cliente => {
            const isExpanded = expandedCliente === cliente.id;
            const docs = clienteDocs[cliente.id] || [];
            const isLoadingThisClient = loadingDocs === cliente.id;
            const grouped = groupByCategoria(docs);

            return (
              <div key={cliente.id} className="dark-card-static overflow-hidden hover:shadow-md transition-shadow duration-300">
                {/* Cliente header - clickable */}
                <button
                  onClick={() => handleToggleCliente(cliente.id)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-[#1a1a1a] transition-colors text-left"
                >
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{getClienteName(cliente)}</p>
                    <p className="text-xs text-white/70 truncate">{cliente.email || 'Sin email'}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {clienteDocs[cliente.id] && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {docs.length} docs
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-white/70" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-white/70" />
                    )}
                  </div>
                </button>

                {/* Expanded documents */}
                {isExpanded && (
                  <div className="border-t border-[#3a3a3a] bg-[#0f0f0f]">
                    {isLoadingThisClient ? (
                      <div className="p-6 text-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto mb-2" />
                        <p className="text-xs text-white/70">Cargando documentos...</p>
                      </div>
                    ) : docs.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-sm text-white/70">No hay documentos para este extranjero</p>
                      </div>
                    ) : (
                      <div className="p-4 space-y-4">
                        {Object.entries(grouped).map(([cat, catDocs]) => (
                          <div key={cat}>
                            <p className="text-xs font-semibold text-white/70 uppercase mb-2 px-2">
                              {CATEGORIA_LABELS[cat] || `📎 ${cat}`}
                            </p>
                            <div className="space-y-1">
                              {catDocs.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors group">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <FileText className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-white truncate">{doc.nombre}</p>
                                      <p className="text-[10px] text-white/70">{formatDate(doc.createdAt)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${ESTATUS_BADGE[doc.estatus] || 'bg-[#1a1a1a] text-white/70 border-[#3a3a3a]'}`}>
                                      {doc.estatus?.replace(/_/g, ' ') || 'pendiente'}
                                    </span>
                                    <button
                                      onClick={() => handleView(doc)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg hover:from-amber-600 hover:to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Eye className="h-3 w-3" /> Ver
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal de visualización de documento */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleCloseModal}>
          <div className="bg-[#171717] rounded-2xl shadow-2xl w-full max-w-4xl mx-4 h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-[#3a3a3a]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3a3a3a] shrink-0">
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
                <button onClick={handleDownload} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white/70 bg-[#222222] rounded-xl hover:bg-[#262626] transition-colors" title="Descargar">
                  <Download className="h-4 w-4" /> Guardar
                </button>
                <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:from-amber-600 hover:to-orange-700 shadow-sm transition-all" title="Imprimir">
                  <Printer className="h-4 w-4" /> Imprimir
                </button>
                <button onClick={handleCloseModal} className="p-2 rounded-xl hover:bg-[#222222] text-white/70 hover:text-white transition-colors" aria-label="Cerrar">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-[#222222] rounded-b-2xl">
              {viewDoc.contentType.includes('pdf') ? (
                <iframe src={viewDoc.url} className="w-full h-full border-0" title={viewDoc.doc.nombre} />
              ) : viewDoc.contentType.includes('image') ? (
                <div className="w-full h-full flex items-center justify-center p-6 overflow-auto">
                  <img src={viewDoc.url} alt={viewDoc.doc.nombre} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8">
                  <FileText className="h-10 w-10 text-amber-500 mb-4" />
                  <p className="text-white/70 font-medium mb-2">Vista previa no disponible</p>
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
