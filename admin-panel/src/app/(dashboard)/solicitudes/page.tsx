'use client';

import { useState, useEffect } from 'react';
import {
  FileText, Search, Eye, CheckCircle, Clock, DollarSign,
  Filter, Upload, Send, Copy, X, ExternalLink, Key, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateDisplay(value: string): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }
  return value;
}

function CopyField({ label, value, isDate }: { label: string; value?: string; isDate?: boolean }) {
  const displayValue = value ? (isDate ? formatDateDisplay(value) : value) : '';
  const copyValue = value ? (isDate ? formatDateDisplay(value) : value) : '';
  if (!value) {
    return (
      <div className="w-full text-left p-1.5">
        {label && <p className="text-[10px] text-white/70">{label}</p>}
        <p className="text-sm text-white/40 italic">—</p>
      </div>
    );
  }
  const handleCopy = () => {
    navigator.clipboard.writeText(copyValue);
    toast.success(`"${copyValue}" copiado`);
  };
  return (
    <button type="button" onClick={handleCopy}
      className="w-full text-left p-1.5 rounded hover:bg-[#252525] border border-transparent hover:border-[#3a3a3a] transition-all group">
      {label && <p className="text-[10px] text-white/70">{label}</p>}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white">{displayValue}</p>
        <Copy className="h-3 w-3 text-gray-300 group-hover:text-amber-500 shrink-0 ml-1" />
      </div>
    </button>
  );
}

// ─── Types & Constants ────────────────────────────────────────────────────────

interface Solicitud {
  id: string;
  tipoTramite: string;
  estatus: string;
  datosFormulario: Record<string, any>;
  numeroPieza?: string;
  contrasenaINM?: string;
  costo: number;
  mercadopagoInitPoint?: string;
  documentoUrl?: string;
  createdAt: string;
  fechaPago?: string;
  beneficiarioId?: string;
  beneficiario?: { id: string; nombre: string; apellidos: string; parentesco: string; nacionalidad?: string };
  userId?: string;
  user?: { fullName: string; email: string };
}

const ESTATUS_BADGE: Record<string, { label: string; className: string }> = {
  pendiente_revision: { label: 'Pendiente revisión', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  en_proceso: { label: 'En proceso', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  pendiente_pago: { label: 'Pendiente pago', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  pagada: { label: 'Pagada', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  cancelada: { label: 'Cancelada', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const TIPO_LABELS: Record<string, string> = {
  visa: 'Visas INM',
  permiso_trabajo: 'Permisos INM',
  notificacion_cambio: 'Notificación de Cambio',
  expedicion_documento: 'Expedición Documento',
  regularizacion_migratoria: 'Regularización',
  constancia_empleador: 'CIE',
  cambio_condicion_estancia: 'Cambio de Condición',
};

const URL_POR_TIPO: Record<string, string> = {
  visa: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html',
  permiso_trabajo: 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html',
  notificacion_cambio: 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html',
  expedicion_documento: 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html',
  regularizacion_migratoria: 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html',
  constancia_empleador: 'https://www.inm.gob.mx/tramites/publico/solicitud_empresa.html',
  cambio_condicion_estancia: 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [costoActual, setCostoActual] = useState(100);
  const [numeroPieza, setNumeroPieza] = useState('');
  const [contrasenaINM, setContrasenaINM] = useState('');
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

  const openModal = (sol: Solicitud) => {
    setSelectedSolicitud(sol);
    setNumeroPieza(sol.numeroPieza || '');
    setContrasenaINM(sol.contrasenaINM || '');
    setPdfFile(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSolicitud(null);
    setNumeroPieza('');
    setContrasenaINM('');
    setPdfFile(null);
  };

  const handleProcesar = async () => {
    if (!selectedSolicitud) return;
    if (!numeroPieza.trim()) { toast.error('Ingresa el número de pieza'); return; }
    if (!contrasenaINM.trim()) { toast.error('Ingresa la clave del INM'); return; }
    setProcesando(true);
    try {
      await api.patch(`/solicitudes/${selectedSolicitud.id}/procesar`, {
        numeroPieza: numeroPieza.trim(),
        contrasenaINM: contrasenaINM.trim() || undefined,
      });
      if (pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        await api.post(`/solicitudes/${selectedSolicitud.id}/documento`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).catch(() => {});
      }
      toast.success('Solicitud procesada. Se generó el pago de $100 MXN y se notificó al extranjero.');
      closeModal();
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
      closeModal();
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
  const getNombre = (s: Solicitud) => {
    // Si tiene beneficiario, usar su nombre
    if (s.beneficiario) return `${s.beneficiario.nombre} ${s.beneficiario.apellidos}`.trim();
    return `${s.datosFormulario?.nombre || ''} ${s.datosFormulario?.apellidos || ''}`.trim() || '—';
  };
  const getCuenta = (s: Solicitud) => s.user?.email || s.datosFormulario?.solicitanteEmail || '';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-neutral-900 via-stone-800 to-amber-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Solicitudes</h1>
            <p className="text-amber-200 mt-1">Generación de solicitudes INM — Costo fijo: ${costoActual} MXN</p>
          </div>
          <button onClick={handleActualizarCosto}
            className="px-4 py-2 bg-[#222222] text-white rounded-xl text-sm font-semibold hover:bg-[#2a2a2a] transition-all border border-white/20">
            ⚙️ Cambiar costo
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'Total', value: solicitudes.length, icon: <FileText className="h-4 w-4" />, colors: 'from-amber-500 to-orange-600' },
          { label: 'Pendientes', value: solicitudes.filter(s => s.estatus === 'pendiente_revision').length, icon: <Clock className="h-4 w-4" />, colors: 'from-yellow-500 to-yellow-600' },
          { label: 'Por cobrar', value: solicitudes.filter(s => s.estatus === 'pendiente_pago').length, icon: <DollarSign className="h-4 w-4" />, colors: 'from-orange-500 to-orange-600' },
          { label: 'Ingresos pagados', value: `$${solicitudes.filter(s => s.estatus === 'pagada').reduce((sum, s) => sum + Number(s.costo), 0).toLocaleString()}`, icon: <CheckCircle className="h-4 w-4" />, colors: 'from-green-500 to-emerald-600' },
        ].map(({ label, value, icon, colors }) => (
          <div key={label} className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-white/70">{label}</p>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${colors} text-white shadow-lg`}>{icon}</div>
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="dark-card-static p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10"><Filter className="h-4 w-4 text-amber-600" /></div>
          <h2 className="text-lg font-bold text-white">Filtros</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
            <input type="text" placeholder="Buscar por nombre o pieza..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-[#3a3a3a] rounded-xl text-sm bg-[#222222] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
          </div>
          <select value={filtroEstatus} onChange={e => setFiltroEstatus(e.target.value)}
            className="px-4 py-3 border border-[#3a3a3a] rounded-xl text-sm bg-[#222222] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all">
            <option value="">Todos los estatus</option>
            <option value="pendiente_revision">Pendiente revisión</option>
            <option value="pendiente_pago">Pendiente pago</option>
            <option value="pagada">Pagada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="dark-card-static overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-[#262626]">
          <div className="p-2 rounded-lg bg-amber-500/10"><FileText className="h-4 w-4 text-amber-600" /></div>
          <h2 className="text-lg font-bold text-white">Solicitudes de Generación</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-white/70 flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-amber-400" />
            </div>
            <p className="text-white/70 font-medium">No hay solicitudes</p>
          </div>
        ) : (
          <div className="divide-y divide-[#262626]">
            {filtered.map(sol => {
              const badge = ESTATUS_BADGE[sol.estatus] || ESTATUS_BADGE.pendiente_revision;
              return (
                <div key={sol.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-[#222222] transition-colors cursor-pointer group"
                  onClick={() => openModal(sol)}>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileText className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{getNombre(sol)}</p>
                      <p className="text-xs text-white/70">{TIPO_LABELS[sol.tipoTramite] || sol.tipoTramite} • {formatDate(sol.createdAt)}
                        {sol.datosFormulario?.ubicacionOrigen?.ciudad && (
                          <span className="text-[10px] text-white/70 ml-2">📍 {sol.datosFormulario.ubicacionOrigen.ciudad}</span>
                        )}
                      </p>
                      {getCuenta(sol) && (
                        <p className="text-[10px] text-white/40 mt-0.5">Cuenta: {getCuenta(sol)}{sol.beneficiario?.parentesco && sol.beneficiario.parentesco !== 'yo_mismo' ? ` · Relación: ${sol.beneficiario.parentesco}` : ''}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {sol.numeroPieza && <span className="text-xs font-mono text-amber-500">#{sol.numeroPieza}</span>}
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${badge.className}`}>{badge.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Modal full-screen ─────────────────────────────────────────────────── */}
      {showModal && selectedSolicitud && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]">
          {/* Topbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626] bg-[#0f0f0f] shrink-0">
            <div>
              <h2 className="text-lg font-bold text-white">
                Procesar solicitud — {getNombre(selectedSolicitud)}
              </h2>
              <p className="text-xs text-white/70">
                {TIPO_LABELS[selectedSolicitud.tipoTramite] || selectedSolicitud.tipoTramite} • {formatDate(selectedSolicitud.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold border ${ESTATUS_BADGE[selectedSolicitud.estatus]?.className}`}>
                {ESTATUS_BADGE[selectedSolicitud.estatus]?.label}
              </span>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-[#222222] text-white/70 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* ── Left panel: Ficha del extranjero (solo visible cuando NO es pendiente_pago/pagada) ── */}
            {selectedSolicitud.estatus !== 'pendiente_pago' && selectedSolicitud.estatus !== 'pagada' && (
            <div className="w-1/3 border-r border-[#262626] overflow-y-auto p-4 bg-[#0f0f0f]">
              <h3 className="text-xs font-semibold text-white/70 uppercase mb-3">Ficha del Extranjero</h3>
              <p className="text-[10px] text-blue-400 mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                Haz clic en cualquier dato para copiarlo al portapapeles.
              </p>
              {selectedSolicitud.datosFormulario && (() => {
                const d = selectedSolicitud.datosFormulario;
                return (
                  <div className="space-y-4">
                    {/* Propósito */}
                    {d.propositoViaje && (
                      <div>
                        <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Propósito de viaje</p>
                        <CopyField label="" value={d.propositoViaje} />
                        {d.especificaTramite && <CopyField label="Especifica" value={d.especificaTramite} />}
                      </div>
                    )}
                    {/* Datos personales */}
                    <div>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Datos del extranjero</p>
                      {d.curpExtranjero && <CopyField label="CURP" value={d.curpExtranjero} />}
                      <CopyField label="Nombre(s)" value={d.nombre} />
                      <CopyField label="Apellido(s)" value={d.apellidos} />
                      <CopyField label="Sexo" value={d.sexo === 'H' ? 'Hombre' : d.sexo === 'M' ? 'Mujer' : d.sexo} />
                      <CopyField label="Fecha nacimiento" value={d.fechaNacimiento} isDate />
                      <CopyField label="Nacionalidad" value={d.nacionalidad} />
                      <CopyField label="Estado civil" value={d.estadoCivil} />
                    </div>
                    {/* Lugar de nacimiento */}
                    <div>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Lugar de nacimiento</p>
                      <CopyField label="País" value={d.paisNacimiento} />
                      <CopyField label="Estado/Provincia" value={d.estadoProvinciaNacimiento} />
                    </div>
                    {/* Documento */}
                    <div>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Documento de identidad</p>
                      <CopyField label="Tipo" value={d.documentoIdentificacion} />
                      <CopyField label="Número" value={d.numeroDocumento} />
                      <CopyField label="País expedición" value={d.paisExpedicion} />
                      <CopyField label="Expedición" value={d.fechaExpedicion} isDate />
                      <CopyField label="Vencimiento" value={d.fechaVencimiento} isDate />
                    </div>
                    {/* Domicilio */}
                    {(d.domEstado || d.domCalle) && (
                      <div>
                        <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Domicilio en México</p>
                        <CopyField label="CP" value={d.domCodigoPostal} />
                        <CopyField label="Estado" value={d.domEstado} />
                        <CopyField label="Municipio" value={d.domMunicipio} />
                        <CopyField label="Colonia" value={d.domColonia} />
                        <CopyField label="Calle" value={d.domCalle} />
                        <CopyField label="Núm. exterior" value={d.domNumeroExterior} />
                        <CopyField label="Núm. interior" value={d.domNumeroInterior} />
                        <CopyField label="Lada" value={d.domLada} />
                        <CopyField label="Teléfono" value={d.domTelefonoFijo} />
                      </div>
                    )}
                    {/* Info adicional (visa) */}
                    {d.actividadPrincipal && (
                      <div>
                        <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Información adicional</p>
                        <CopyField label="Actividad principal" value={d.actividadPrincipal} />
                        <CopyField label="Sector trabajo" value={d.sectorTrabajo} />
                        <CopyField label="Situación trabajo" value={d.situacionTrabajo} />
                        <CopyField label="Ocupación" value={d.ocupacionTrabajo} />
                        <CopyField label="¿Expulsado?" value={d.expulsadoMexico} />
                        <CopyField label="¿Antecedentes?" value={d.antecedentesPenales} />
                      </div>
                    )}
                    {/* Visas (solo visa) */}
                    {selectedSolicitud.tipoTramite === 'visa' && d.visas?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Visas del extranjero</p>
                        {d.visas.map((visa: any, i: number) => (
                          <div key={i} className="p-2 rounded-lg border border-[#3a3a3a] bg-[#1a1a1a] mb-1">
                            <CopyField label={`Visa ${i + 1} - País`} value={visa.pais} />
                            <CopyField label="Número" value={visa.numero} />
                            {visa.fechaVencimiento && <CopyField label="Vencimiento" value={visa.fechaVencimiento} isDate />}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Empleador */}
                    {d.empleadorTipoPersona && (
                      <div>
                        <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Empleador</p>
                        <CopyField label="Tipo persona" value={d.empleadorTipoPersona} />
                        <CopyField label="RFC" value={d.empleadorRfc} />
                        <CopyField label="Expediente" value={d.empleadorNumeroExpediente} />
                      </div>
                    )}
                    {/* Solicitante (visa) */}
                    {d.solicitante?.tipoPersona && (
                      <div>
                        <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Solicitante de visa</p>
                        <CopyField label="Tipo persona" value={d.solicitante.tipoPersona} />
                        <CopyField label="CURP" value={d.solicitante.curp} />
                        <CopyField label="RFC" value={d.solicitante.rfc || d.solicitante.moralRfc} />
                        <CopyField label="Nombre" value={d.solicitante.nombre || d.solicitante.moralRazonSocial} />
                        <CopyField label="Apellidos" value={d.solicitante.apellidos} />
                        <CopyField label="Nacionalidad" value={d.solicitante.nacionalidad} />
                        <CopyField label="Vínculo" value={d.solicitante.vinculoParentesco} />
                      </div>
                    )}
                    {/* Contacto */}
                    <div>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Contacto</p>
                      <CopyField label="Email" value={d.solicitanteEmail || d.email} />
                      <CopyField label="Teléfono" value={d.telefono} />
                    </div>
                    {/* Ubicación de origen */}
                    {d.ubicacionOrigen && (
                      <div className="col-span-2 mt-2 p-3 rounded-lg bg-amber-500/[0.04] border border-amber-500/20">
                        <p className="text-[10px] text-amber-400 uppercase font-semibold mb-1">📍 Ubicación de origen</p>
                        <p className="text-sm text-white">{d.ubicacionOrigen.ciudad || `${d.ubicacionOrigen.lat}, ${d.ubicacionOrigen.lng}`}</p>
                        {d.ubicacionOrigen.lat && (
                          <a href={`https://maps.google.com/?q=${d.ubicacionOrigen.lat},${d.ubicacionOrigen.lng}`} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 hover:text-amber-300 mt-1 inline-block">
                            🗺️ Ver en Google Maps
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            )}

            {/* ── Right panel: iframe INM (solo para pendiente_revision/en_proceso) o pantalla de pago ── */}
            <div className="flex-1 flex flex-col overflow-hidden">

              {/* Pantalla de pago - cuando ya se procesó */}
              {(selectedSolicitud.estatus === 'pendiente_pago' || selectedSolicitud.estatus === 'pagada') ? (
                <div className="flex-1 flex flex-col justify-center items-center p-12 relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-600/5 rounded-full blur-3xl" />
                  </div>

                  {selectedSolicitud.estatus === 'pendiente_pago' && (
                    <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-8">
                      {/* Animated icon */}
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center animate-pulse">
                          <Clock className="h-10 w-10 text-amber-400" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                          <DollarSign className="h-3 w-3 text-white" />
                        </div>
                      </div>

                      {/* Title */}
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold text-white">Esperando pago</h3>
                        <p className="text-sm text-white/60">El extranjero debe realizar el pago de <span className="text-amber-400 font-semibold">$100 MXN</span> para completar el trámite</p>
                      </div>

                      {/* Info card */}
                      <div className="w-full rounded-2xl bg-[#141414] border border-[#2a2a2a] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#2a2a2a] bg-[#1a1a1a]">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Número de Pieza INM</p>
                              <p className="text-xl font-mono font-bold text-amber-400 mt-1">{selectedSolicitud.numeroPieza || '—'}</p>
                            </div>
                            <div className="px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                              <p className="text-[10px] font-semibold text-orange-400 uppercase">Pendiente</p>
                            </div>
                          </div>
                        </div>
                        <div className="px-6 py-4 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/50">Cliente</span>
                            <span className="text-white font-medium">{getNombre(selectedSolicitud)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/50">Trámite</span>
                            <span className="text-white font-medium">{TIPO_LABELS[selectedSolicitud.tipoTramite] || selectedSolicitud.tipoTramite}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/50">Monto</span>
                            <span className="text-amber-400 font-bold">$100 MXN</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="w-full space-y-3">
                        {selectedSolicitud.mercadopagoInitPoint && (
                          <a href={selectedSolicitud.mercadopagoInitPoint} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30 hover:scale-[1.01]">
                            <ExternalLink className="h-4 w-4" /> Ver link de pago
                          </a>
                        )}
                        <button
                          onClick={async () => {
                            if (!selectedSolicitud) return;
                            try {
                              await api.patch(`/solicitudes/${selectedSolicitud.id}/reenviar-pago`);
                              toast.success('Link de pago reenviado al extranjero');
                              fetchSolicitudes();
                            } catch { toast.error('Error al reenviar'); }
                          }}
                          className="flex items-center justify-center gap-2 w-full px-5 py-3 border border-[#3a3a3a] text-white/80 rounded-xl text-sm font-medium hover:bg-[#1a1a1a] hover:border-amber-500/30 hover:text-amber-400 transition-all">
                          <Send className="h-4 w-4" /> Reenviar link de pago al extranjero
                        </button>
                        <button
                          onClick={() => handleConfirmarPago(selectedSolicitud.id)}
                          className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01]">
                          <CheckCircle className="h-4 w-4" /> Confirmar pago manualmente
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedSolicitud.estatus === 'pagada' && (
                    <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-8">
                      {/* Success icon */}
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 flex items-center justify-center">
                          <CheckCircle className="h-12 w-12 text-emerald-400" />
                        </div>
                      </div>

                      {/* Title */}
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold text-emerald-400">Pago completado</h3>
                        <p className="text-sm text-white/60">El trámite fue pagado exitosamente y se ha completado el proceso</p>
                      </div>

                      {/* Info card */}
                      <div className="w-full rounded-2xl bg-[#141414] border border-[#2a2a2a] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#2a2a2a] bg-[#1a1a1a]">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Número de Pieza INM</p>
                              <p className="text-xl font-mono font-bold text-amber-400 mt-1">{selectedSolicitud.numeroPieza || '—'}</p>
                            </div>
                            <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                              <p className="text-[10px] font-semibold text-emerald-400 uppercase">Pagada</p>
                            </div>
                          </div>
                        </div>
                        <div className="px-6 py-4 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/50">Cliente</span>
                            <span className="text-white font-medium">{getNombre(selectedSolicitud)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/50">Trámite</span>
                            <span className="text-white font-medium">{TIPO_LABELS[selectedSolicitud.tipoTramite] || selectedSolicitud.tipoTramite}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/50">Fecha de pago</span>
                            <span className="text-emerald-400 font-medium">{selectedSolicitud.fechaPago ? formatDate(selectedSolicitud.fechaPago) : '—'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Close action */}
                      <button
                        onClick={closeModal}
                        className="flex items-center justify-center gap-2 w-full max-w-xs px-5 py-3 border border-[#3a3a3a] text-white/70 rounded-xl text-sm font-medium hover:bg-[#1a1a1a] hover:text-white transition-all">
                        Cerrar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Iframe INM - solo para pendiente_revision y en_proceso */}
                  <div className="flex-1 relative overflow-hidden border-b border-[#262626]">
                    <div className="absolute top-2 right-3 z-10 flex items-center gap-2">
                      <a href={URL_POR_TIPO[selectedSolicitud.tipoTramite] || URL_POR_TIPO.permiso_trabajo}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 bg-[#1a1a1a] border border-[#3a3a3a] px-2 py-1 rounded-lg">
                        <ExternalLink className="h-3 w-3" /> Abrir en nueva pestaña
                      </a>
                    </div>
                    <iframe
                      src={URL_POR_TIPO[selectedSolicitud.tipoTramite] || URL_POR_TIPO.permiso_trabajo}
                      className="w-full h-full"
                      title="Formulario INM"
                    />
                  </div>

                  {/* Pieza + Clave + PDF + Botón */}
                  <div className="p-5 bg-[#0f0f0f] shrink-0 overflow-y-auto max-h-[320px]">
                    {(selectedSolicitud.estatus === 'pendiente_revision' || selectedSolicitud.estatus === 'en_proceso') && (
                      <div className="space-y-4">
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                          <p className="text-sm text-amber-300">
                            <strong>Al finalizar en el INM:</strong> Ingresa el número de pieza y la clave que te proporcionó el sistema, sube el PDF y haz clic en &quot;Procesar&quot;.
                            Se generará automáticamente el cobro de <strong>$100 MXN</strong> al extranjero.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-white/70 mb-1 flex items-center gap-1">
                              <Key className="h-3 w-3" /> Número de Pieza *
                            </label>
                            <input type="text"
                              value={numeroPieza}
                              onChange={e => setNumeroPieza(e.target.value)}
                              className="w-full px-3 py-2.5 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
                              placeholder="0000011969016" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white/70 mb-1 flex items-center gap-1">
                              <Key className="h-3 w-3" /> Clave INM *
                            </label>
                            <input type="text"
                              value={contrasenaINM}
                              onChange={e => setContrasenaINM(e.target.value.toUpperCase())}
                              className="w-full px-3 py-2.5 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
                              placeholder="QFCSA" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white/70 mb-1 flex items-center gap-1">
                              <Upload className="h-3 w-3" /> PDF Solicitud
                            </label>
                            <label className="flex items-center gap-2 px-3 py-2.5 border border-[#3a3a3a] bg-[#252525] rounded-lg text-sm text-white/70 hover:bg-[#2a2a2a] cursor-pointer">
                              <Upload className="h-4 w-4 shrink-0" />
                              <span className="truncate">{pdfFile ? pdfFile.name : 'Seleccionar PDF...'}</span>
                              <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="hidden" />
                            </label>
                          </div>
                        </div>

                        <button
                          onClick={handleProcesar}
                          disabled={procesando}
                          className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2">
                          {procesando ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</>
                          ) : (
                            <><Send className="h-4 w-4" /> Procesar y generar pago ($100 MXN)</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
