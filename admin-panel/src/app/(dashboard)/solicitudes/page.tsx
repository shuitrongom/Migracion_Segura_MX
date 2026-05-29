'use client';

import { useState, useEffect } from 'react';
import { FileText, Search, Eye, CheckCircle, Clock, DollarSign, Filter, ChevronLeft, ChevronRight, Upload, Send } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Solicitud {
  id: string;
  tipoTramite: string;
  estatus: string;
  datosFormulario: Record<string, any>;
  numeroPieza?: string;
  costo: number;
  mercadopagoInitPoint?: string;
  documentoUrl?: string;
  createdAt: string;
  fechaPago?: string;
}

const ESTATUS_BADGE: Record<string, { label: string; className: string }> = {
  pendiente_revision: { label: 'Pendiente revisión', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  en_proceso: { label: 'En proceso', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  pendiente_pago: { label: 'Pendiente pago', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  pagada: { label: 'Pagada', className: 'bg-green-50 text-green-700 border-green-200' },
  cancelada: { label: 'Cancelada', className: 'bg-red-50 text-red-700 border-red-200' },
};

const TIPO_LABELS: Record<string, string> = {
  visa: 'Visas INM', permiso_trabajo: 'Permisos INM', notificacion_cambio: 'Notificación de Cambio',
  expedicion_documento: 'Expedición Documento', regularizacion_migratoria: 'Regularización',
  constancia_empleador: 'CIE', cambio_condicion_estancia: 'Cambio de Condición',
};

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [costoActual, setCostoActual] = useState(100);
  const [formProcesar, setFormProcesar] = useState({ numeroPieza: '', contrasenaINM: '', requisitos: '', observaciones: '' });
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  useEffect(() => { fetchSolicitudes(); fetchCosto(); }, []);

  const fetchSolicitudes = async () => {
    try {
      const res = await api.get('/solicitudes', { params: { page: 1, limit: 50 } });
      setSolicitudes(res.data?.data || []);
    } catch { setSolicitudes([]); }
    finally { setLoading(false); }
  };

  const fetchCosto = async () => {
    try {
      const res = await api.get('/solicitudes/config/costo');
      setCostoActual(res.data?.costo || 100);
    } catch {}
  };

  const handleProcesar = async () => {
    if (!selectedSolicitud) return;
    if (!formProcesar.numeroPieza.trim()) { toast.error('Ingresa el número de pieza'); return; }
    setProcesando(true);
    try {
      const requisitosArr = formProcesar.requisitos.split('\n').filter(r => r.trim());
      await api.patch(`/solicitudes/${selectedSolicitud.id}/procesar`, {
        numeroPieza: formProcesar.numeroPieza,
        contrasenaINM: formProcesar.contrasenaINM || undefined,
        requisitos: requisitosArr.length > 0 ? requisitosArr : undefined,
        observaciones: formProcesar.observaciones || undefined,
      });

      // Subir PDF si hay
      if (pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        await api.post(`/solicitudes/${selectedSolicitud.id}/documento`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {});
      }

      toast.success('Solicitud procesada. Se generó el pago y se enviaron requisitos al extranjero.');
      setShowModal(false);
      setFormProcesar({ numeroPieza: '', contrasenaINM: '', requisitos: '', observaciones: '' });
      setPdfFile(null);
      fetchSolicitudes();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al procesar');
    } finally { setProcesando(false); }
  };

  const handleConfirmarPago = async (id: string) => {
    if (!confirm('¿Confirmar pago manualmente?')) return;
    try {
      await api.patch(`/solicitudes/${id}/confirmar-pago`, { paymentId: 'manual-admin' });
      toast.success('Pago confirmado. Se notificó al extranjero.');
      fetchSolicitudes();
      setShowModal(false);
    } catch { toast.error('Error al confirmar pago'); }
  };

  const handleActualizarCosto = async () => {
    const nuevo = prompt('Nuevo costo de solicitud (MXN):', costoActual.toString());
    if (!nuevo) return;
    try {
      await api.patch('/solicitudes/config/costo', { costo: parseFloat(nuevo) });
      setCostoActual(parseFloat(nuevo));
      toast.success(`Costo actualizado a $${nuevo} MXN`);
    } catch { toast.error('Error al actualizar costo'); }
  };

  const filtered = solicitudes.filter(s => {
    const nombre = `${s.datosFormulario?.nombre || ''} ${s.datosFormulario?.apellidos || ''}`.toLowerCase();
    const matchSearch = !search || nombre.includes(search.toLowerCase()) || (s.numeroPieza || '').includes(search);
    const matchEstatus = !filtroEstatus || s.estatus === filtroEstatus;
    return matchSearch && matchEstatus;
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  const getNombre = (s: Solicitud) => `${s.datosFormulario?.nombre || ''} ${s.datosFormulario?.apellidos || ''}`.trim() || '—';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-stone-800 to-amber-700 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Solicitudes</h1>
            <p className="text-amber-200 mt-1">Generación de solicitudes INM — Costo: ${costoActual} MXN</p>
          </div>
          <button onClick={handleActualizarCosto} className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-semibold hover:bg-white/30 transition-all border border-white/20">
            ⚙️ Cambiar costo
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg"><FileText className="h-4 w-4" /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{solicitudes.length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500 to-yellow-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Pendientes</p>
              <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg"><Clock className="h-4 w-4" /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{solicitudes.filter(s => s.estatus === 'pendiente_revision').length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Por cobrar</p>
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg"><DollarSign className="h-4 w-4" /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{solicitudes.filter(s => s.estatus === 'pendiente_pago').length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Pagadas</p>
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg"><CheckCircle className="h-4 w-4" /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">${solicitudes.filter(s => s.estatus === 'pagada').reduce((sum, s) => sum + Number(s.costo), 0).toLocaleString()}</p>
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
            <input type="text" placeholder="Buscar por nombre o pieza..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
          </div>
          <select value={filtroEstatus} onChange={e => setFiltroEstatus(e.target.value)} className="px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all">
            <option value="">Todos los estatus</option>
            <option value="pendiente_revision">Pendiente revisión</option>
            <option value="pendiente_pago">Pendiente pago</option>
            <option value="pagada">Pagada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 px-6 py-4 border-b">
          <div className="p-2 rounded-lg bg-amber-50"><FileText className="h-4 w-4 text-amber-600" /></div>
          <h2 className="text-lg font-bold text-gray-900">Solicitudes de Generación</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-amber-400" />
            </div>
            <p className="text-gray-500 font-medium">No hay solicitudes</p>
            <p className="text-sm text-gray-400 mt-1">Las solicitudes de los extranjeros aparecerán aquí</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map(sol => {
              const badge = ESTATUS_BADGE[sol.estatus] || ESTATUS_BADGE.pendiente_revision;
              return (
                <div key={sol.id} className="flex items-center justify-between px-6 py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-colors group cursor-pointer" onClick={() => { setSelectedSolicitud(sol); setShowModal(true); }}>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <FileText className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 capitalize">{getNombre(sol)}</p>
                      <p className="text-xs text-gray-500">{TIPO_LABELS[sol.tipoTramite] || sol.tipoTramite} • {formatDate(sol.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {sol.numeroPieza && <span className="text-xs font-mono text-brand-600">#{sol.numeroPieza}</span>}
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${badge.className}`}>{badge.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de detalle/procesar */}
      {showModal && selectedSolicitud && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Solicitud de {getNombre(selectedSolicitud)}</h2>
                <p className="text-xs text-gray-500">{TIPO_LABELS[selectedSolicitud.tipoTramite] || selectedSolicitud.tipoTramite} • {formatDate(selectedSolicitud.createdAt)}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 text-xl">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Datos del extranjero */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Eye className="h-4 w-4 text-brand-500" /> Datos del extranjero</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
                  {Object.entries(selectedSolicitud.datosFormulario || {}).map(([key, val]) => (
                    <div key={key}>
                      <p className="text-[10px] text-gray-400 uppercase">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-sm text-gray-900 capitalize">{String(val) || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estatus actual */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border">
                <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold border ${ESTATUS_BADGE[selectedSolicitud.estatus]?.className}`}>
                  {ESTATUS_BADGE[selectedSolicitud.estatus]?.label}
                </span>
                {selectedSolicitud.numeroPieza && <span className="text-sm font-mono text-brand-600">Pieza: {selectedSolicitud.numeroPieza}</span>}
                <span className="text-sm text-gray-500 ml-auto">${selectedSolicitud.costo} MXN</span>
              </div>

              {/* Acciones según estatus */}
              {selectedSolicitud.estatus === 'pendiente_revision' && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Send className="h-4 w-4 text-brand-500" /> Procesar solicitud</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Número de pieza *</label>
                      <input type="text" value={formProcesar.numeroPieza} onChange={e => setFormProcesar(p => ({ ...p, numeroPieza: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Pieza del INM" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña INM</label>
                      <input type="text" value={formProcesar.contrasenaINM} onChange={e => setFormProcesar(p => ({ ...p, contrasenaINM: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Clave" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Requisitos (uno por línea)</label>
                    <textarea value={formProcesar.requisitos} onChange={e => setFormProcesar(p => ({ ...p, requisitos: e.target.value }))} rows={4} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" placeholder="Pasaporte vigente&#10;Formato de solicitud&#10;Comprobante de domicilio" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">PDF de la solicitud</label>
                    <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
                  </div>
                  <button onClick={handleProcesar} disabled={procesando} className="w-full px-4 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl text-sm font-semibold hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 shadow-lg shadow-brand-200/30 transition-all">
                    {procesando ? 'Procesando...' : 'Procesar y generar pago ($' + selectedSolicitud.costo + ' MXN)'}
                  </button>
                </div>
              )}

              {selectedSolicitud.estatus === 'pendiente_pago' && (
                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm text-gray-500">Esperando pago del extranjero...</p>
                  {selectedSolicitud.mercadopagoInitPoint && (
                    <a href={selectedSolicitud.mercadopagoInitPoint} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                      🔗 Ver link de pago
                    </a>
                  )}
                  <button onClick={() => handleConfirmarPago(selectedSolicitud.id)} className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-200/30 transition-all">
                    ✅ Confirmar pago manualmente
                  </button>
                </div>
              )}

              {selectedSolicitud.estatus === 'pagada' && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">Solicitud pagada y entregada</p>
                      <p className="text-xs text-green-600">Pagada el {selectedSolicitud.fechaPago ? formatDate(selectedSolicitud.fechaPago) : '—'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
