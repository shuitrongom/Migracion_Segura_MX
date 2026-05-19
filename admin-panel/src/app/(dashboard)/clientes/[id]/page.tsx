'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Camera,
  Pencil,
  Check,
  X,
  FileText,
  Clock,
  Calendar,
  RefreshCw,
  Trash2,
  Eye,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/lib/types';
import { CitasTab } from '@/components/citas-tab';

// --- Interfaces ---

interface ClienteDetail {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  asesor?: { fullName: string } | null;
  etiquetas: string[];
  createdAt: string;
}

interface TramiteResumen {
  id: string;
  tipo: string;
  estatus: string;
  numeroPieza?: string | null;
  clienteId: string;
  datosFormulario?: Record<string, unknown> | null;
  createdAt: string;
}

interface DocumentoItem {
  id: string;
  nombre: string;
  categoria?: string;
  estatus: string;
  createdAt: string;
}

interface TimelineEvent {
  id: string;
  nombre: string;
  completada: boolean;
  fechaCompletada?: string | null;
  observaciones?: string | null;
  createdAt: string;
}

type TabKey = 'tramites' | 'documentos' | 'citas' | 'actividad';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'tramites', label: 'Trámites' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'citas', label: 'Citas' },
  { key: 'actividad', label: 'Actividad' },
];

const ESTATUS_BADGE: Record<string, string> = {
  en_revision: 'bg-yellow-50 text-yellow-700',
  recibido: 'bg-blue-50 text-blue-700',
  aprobado: 'bg-green-50 text-green-700',
  rechazado: 'bg-red-50 text-red-700',
  borrador: 'bg-gray-50 text-gray-700',
  en_espera_resolucion: 'bg-orange-50 text-orange-700',
  cancelado: 'bg-red-50 text-red-600',
  pendiente: 'bg-yellow-50 text-yellow-700',
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

export default function ClienteDetailPage() {
  const params = useParams();
  const clienteId = params.id as string;
  const { user } = useAuthStore();

  const [cliente, setCliente] = useState<ClienteDetail | null>(null);
  const [tramites, setTramites] = useState<TramiteResumen[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('tramites');

  // Inline edit states
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingTelefono, setEditingTelefono] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [telefonoValue, setTelefonoValue] = useState('');
  const [savingField, setSavingField] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [reassigning, setReassigning] = useState(false);
  const [docPreview, setDocPreview] = useState<{ url: string; nombre: string; tipo: string } | null>(null);

  const isAdmin = user?.role === UserRole.ADMINISTRADOR;
  const isGestor = user?.role === UserRole.ASESOR;
  const canEditEmail = isAdmin;
  const canEditTelefono = isAdmin || isGestor;

  // Fetch client data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const clienteRes = await api.get(`/clientes/${clienteId}`);
        setCliente(clienteRes.data);
        setEmailValue(clienteRes.data.email || '');
        setTelefonoValue(clienteRes.data.telefono || '');
        setFotoUrl(clienteRes.data.metadata?.fotoUrl || null);

        // Fetch tramites separately
        const tramitesRes = await api.get('/tramites', {
          params: { page: 1, limit: 50 },
        });
        const allTramites: TramiteResumen[] = tramitesRes.data?.data || tramitesRes.data || [];
        const clienteTramites = allTramites.filter(
          (t) => t.clienteId === clienteId
        );
        setTramites(clienteTramites);
      } catch {
        setError('Error al cargar los datos del cliente');
      } finally {
        setLoading(false);
      }
    }
    if (clienteId) fetchData();
  }, [clienteId]);

  // Fetch documents when tab changes to documentos
  const fetchDocumentos = useCallback(async () => {
    if (tramites.length === 0) {
      setDocumentos([]);
      return;
    }
    try {
      const allDocs: DocumentoItem[] = [];
      for (const tramite of tramites) {
        try {
          const res = await api.get(`/documentos/tramite/${tramite.id}`);
          const docs: DocumentoItem[] = res.data?.data || res.data || [];
          allDocs.push(...docs);
        } catch {
          // Skip if no documents for this tramite
        }
      }
      setDocumentos(allDocs);
    } catch {
      setDocumentos([]);
    }
  }, [tramites]);

  // Fetch timeline when tab changes to actividad
  const fetchTimeline = useCallback(async () => {
    try {
      const res = await api.get(`/clientes/${clienteId}/actividad`);
      const events = (res.data || []).map((log: any) => ({
        id: log.id,
        nombre: log.action === 'TRAMITE_CREADO' ? 'Trámite creado' :
                log.action === 'CAMBIO_ESTATUS' ? `Estatus cambiado a: ${log.details?.estatusNuevo || ''}` :
                log.action === 'DOCUMENTO_SUBIDO' ? `Documento subido: ${log.details?.nombre || ''}` :
                log.action,
        completada: true,
        fechaCompletada: log.createdAt,
        observaciones: log.details?.observaciones || null,
        createdAt: log.createdAt,
      }));
      setTimeline(events);
    } catch {
      setTimeline([]);
    }
  }, [clienteId]);

  useEffect(() => {
    if (activeTab === 'documentos') {
      fetchDocumentos();
    } else if (activeTab === 'actividad') {
      fetchTimeline();
    }
  }, [activeTab, fetchDocumentos, fetchTimeline]);

  const formatDate = (dateStr: string): string => {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  // Save email
  const handleSaveEmail = async () => {
    if (!emailValue.trim() || emailValue === cliente?.email) {
      setEditingEmail(false);
      return;
    }
    try {
      setSavingField('email');
      await api.put(`/clientes/${clienteId}`, { email: emailValue.trim() });
      setCliente((prev) =>
        prev ? { ...prev, email: emailValue.trim() } : prev
      );
      setEditingEmail(false);
    } catch {
      // Revert on error
      setEmailValue(cliente?.email || '');
    } finally {
      setSavingField(null);
    }
  };

  // Save telefono
  const handleSaveTelefono = async () => {
    if (!telefonoValue.trim() || telefonoValue === cliente?.telefono) {
      setEditingTelefono(false);
      return;
    }
    try {
      setSavingField('telefono');
      await api.put(`/clientes/${clienteId}`, {
        telefono: telefonoValue.trim(),
      });
      setCliente((prev) =>
        prev ? { ...prev, telefono: telefonoValue.trim() } : prev
      );
      setEditingTelefono(false);
    } catch {
      // Revert on error
      setTelefonoValue(cliente?.telefono || '');
    } finally {
      setSavingField(null);
    }
  };

  // Get pieza and clave from first tramite's datosFormulario
  const firstTramite = tramites.length > 0 ? tramites[0] : null;
  const numeroPiezaINM =
    (firstTramite?.datosFormulario?.numeroPiezaINM as string) || null;
  const contrasenaINM =
    (firstTramite?.datosFormulario?.contrasenaINM as string) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/clientes"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Detalle del Extranjero
          </h1>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
          <p className="text-sm text-gray-500">
            {error || 'No se encontró el extranjero'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/clientes"
          className="p-2 rounded-xl hover:bg-brand-50 text-gray-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Detalle del Extranjero
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card - Left Side */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            {/* Avatar + Name */}
            <div className="p-6 pb-4 bg-gradient-to-br from-gray-50 to-brand-50/30 border-b">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  {fotoUrl ? (
                    <img src={fotoUrl} alt={cliente.nombreCompleto} className="h-16 w-16 rounded-2xl object-cover border-2 border-white shadow-md" />
                  ) : (
                    <div className="h-16 w-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center shadow-md">
                      <span className="text-2xl font-bold text-white">
                        {cliente.nombreCompleto.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <label
                    htmlFor="foto-extranjero"
                    className="absolute -bottom-1 -right-1 h-7 w-7 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-brand-50 cursor-pointer transition-colors"
                    title="Subir foto"
                  >
                    <Camera className="h-3.5 w-3.5 text-brand-600" />
                  </label>
                  {fotoUrl && (
                    <button
                      onClick={async () => {
                        try {
                          await api.delete(`/clientes/${clienteId}/foto`);
                          setFotoUrl(null);
                          toast.success('Foto eliminada');
                        } catch {
                          setFotoUrl(null);
                          toast.success('Foto eliminada');
                        }
                      }}
                      className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar foto"
                    >
                      <Trash2 className="h-2.5 w-2.5 text-white" />
                    </button>
                  )}
                  <input
                    id="foto-extranjero"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const preview = URL.createObjectURL(file);
                      setFotoUrl(preview);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const res = await api.post(`/clientes/${clienteId}/foto`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                        if (res.data.fotoUrl) {
                          setFotoUrl(res.data.fotoUrl);
                        }
                        toast.success('Foto subida exitosamente');
                      } catch (err: any) {
                        const msg = err?.response?.data?.message || 'Error al subir foto al servidor';
                        toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
                      }
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {cliente.nombreCompleto}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Extranjero desde {formatDate(cliente.createdAt)}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 pt-4">

            {/* Info Fields */}
            <div className="space-y-1">
              {/* Email */}
              <div className="p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Email
                  </p>
                  {canEditEmail && !editingEmail && (
                    <button
                      onClick={() => setEditingEmail(true)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      title="Editar email"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {editingEmail ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="email"
                      value={emailValue}
                      onChange={(e) => setEmailValue(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEmail}
                      disabled={savingField === 'email'}
                      className="p-1.5 rounded-md bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
                      title="Guardar"
                    >
                      {savingField === 'email' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingEmail(false);
                        setEmailValue(cliente.email);
                      }}
                      className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"
                      title="Cancelar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-900 mt-0.5">
                    {cliente.email}
                  </p>
                )}
              </div>

              {/* Teléfono */}
              <div className="p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Teléfono
                  </p>
                  {canEditTelefono && !editingTelefono && (
                    <button
                      onClick={() => setEditingTelefono(true)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      title="Editar teléfono"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {editingTelefono ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="tel"
                      value={telefonoValue}
                      onChange={(e) => setTelefonoValue(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveTelefono}
                      disabled={savingField === 'telefono'}
                      className="p-1.5 rounded-md bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
                      title="Guardar"
                    >
                      {savingField === 'telefono' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingTelefono(false);
                        setTelefonoValue(cliente.telefono);
                      }}
                      className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"
                      title="Cancelar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-900 mt-0.5">
                    {cliente.telefono}
                  </p>
                )}
              </div>

              {/* Gestor */}
              <div className="p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Gestor asignado
                  </p>
                  {isAdmin && (
                    <button
                      onClick={async () => {
                        setReassigning(true);
                        try {
                          const res = await api.patch(`/clientes/${clienteId}/asesor`, { auto: true });
                          setCliente(prev => prev ? { ...prev, asesor: res.data?.asesor || prev.asesor } : prev);
                          toast.success('Gestor reasignado');
                          window.location.reload();
                        } catch { toast.error('Error al reasignar gestor'); }
                        finally { setReassigning(false); }
                      }}
                      disabled={reassigning}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-brand-500 transition-colors disabled:opacity-50"
                      title="Reasignar gestor automáticamente"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${reassigning ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-900 mt-0.5">
                  {cliente.asesor?.fullName || 'Sin asignar'}
                </p>
              </div>

              {/* Fecha de registro */}
              <div className="p-3 rounded-xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Fecha de registro
                </p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {formatDate(cliente.createdAt)}
                </p>
              </div>
            </div>

            {/* Pieza & Clave INM */}
            {(numeroPiezaINM || contrasenaINM) && (
              <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl space-y-3">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  🔑 Datos INM
                </p>
                {numeroPiezaINM && (
                  <div>
                    <p className="text-[10px] text-amber-600">Pieza</p>
                    <p className="text-sm font-mono font-bold text-gray-900">
                      {numeroPiezaINM}
                    </p>
                  </div>
                )}
                {contrasenaINM && (
                  <div>
                    <p className="text-[10px] text-amber-600">Clave</p>
                    <p className="text-sm font-mono font-bold text-gray-900">
                      {contrasenaINM}
                    </p>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Tabs - Right Side */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border shadow-sm">
            {/* Tab Navigation */}
            <div className="border-b">
              <nav className="flex gap-1 px-2 pt-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all duration-200 ${
                      activeTab === tab.key
                        ? 'bg-white text-brand-600 border-2 border-b-0 border-brand-200 shadow-sm -mb-[2px]'
                        : 'text-gray-500 hover:text-brand-600 hover:bg-brand-50/50'
                    }`}
                    role="tab"
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Trámites Tab */}
              {activeTab === 'tramites' && (
                <div className="space-y-3">
                  {tramites.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">
                        Este extranjero no tiene trámites registrados.
                      </p>
                    </div>
                  ) : (
                    tramites.map((tramite) => (
                      <Link
                        key={tramite.id}
                        href={`/tramites/${tramite.id}`}
                        className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {TIPO_LABELS[tramite.tipo] ?? tramite.tipo}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {tramite.numeroPieza ||
                                (tramite.datosFormulario
                                  ?.numeroPiezaINM as string) ||
                                'Sin número de pieza'}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDate(tramite.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              ESTATUS_BADGE[tramite.estatus] ??
                              'bg-gray-50 text-gray-700'
                            }`}
                          >
                            {tramite.estatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {/* Documentos Tab */}
              {activeTab === 'documentos' && (
                <div className="space-y-3">
                  {documentos.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">
                        No hay documentos registrados para este extranjero.
                      </p>
                    </div>
                  ) : (
                    documentos.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-brand-200 hover:shadow-md bg-gradient-to-r from-white to-gray-50/50 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-brand-100 to-amber-100 rounded-xl flex items-center justify-center shadow-sm">
                            <FileText className="h-5 w-5 text-brand-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {doc.nombre}
                            </p>
                            <p className="text-xs text-gray-500">
                              {doc.categoria || 'Sin categoría'} •{' '}
                              {formatDate(doc.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const res = await api.get(`/documentos/${doc.id}/download`, { responseType: 'blob' });
                                const contentType = String(res.headers['content-type'] || 'application/pdf');
                                const blob = new Blob([res.data], { type: contentType });
                                const url = URL.createObjectURL(blob);
                                setDocPreview({ url, nombre: doc.nombre, tipo: contentType });
                              } catch {
                                toast.error('Error al cargar el documento');
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg hover:from-brand-600 hover:to-brand-700 shadow-sm transition-all"
                            title="Ver documento"
                          >
                            <Eye className="h-3.5 w-3.5" /> Ver
                          </button>
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                              ESTATUS_BADGE[doc.estatus] ??
                              'bg-gray-50 text-gray-700'
                            }`}
                          >
                            {doc.estatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Citas Tab */}
              {activeTab === 'citas' && (
                <CitasTab clienteId={clienteId} />
              )}

              {/* Actividad Tab */}
              {activeTab === 'actividad' && (
                <div>
                  {timeline.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">
                        No hay actividad registrada.
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                      <div className="space-y-6">
                        {timeline.map((event) => (
                          <div
                            key={event.id}
                            className="relative flex items-start gap-4 pl-10"
                          >
                            <div
                              className={`absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 ${
                                event.completada
                                  ? 'bg-green-500 border-green-500'
                                  : 'bg-white border-gray-300'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {event.nombre}
                              </p>
                              {event.observaciones && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {event.observaciones}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {event.fechaCompletada
                                  ? formatDate(event.fechaCompletada)
                                  : formatDate(event.createdAt)}
                              </p>
                            </div>
                            {event.completada && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                Completada
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de visualización de documento */}
      {docPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-[95vw] h-[90vh] max-w-5xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header del modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-brand-100 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{docPreview.nombre}</h3>
                  <p className="text-xs text-gray-500">Vista previa del documento</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = docPreview.url;
                    a.download = docPreview.nombre;
                    a.click();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5 rotate-[270deg]" /> Descargar
                </button>
                <button
                  onClick={() => {
                    const printWindow = window.open('');
                    if (printWindow) {
                      if (docPreview.tipo.startsWith('image/')) {
                        printWindow.document.write(`<img src="${docPreview.url}" onload="window.print();window.close();" style="max-width:100%" />`);
                      } else {
                        printWindow.document.write(`<iframe src="${docPreview.url}" style="width:100%;height:100%;border:none;" onload="window.print();"></iframe>`);
                      }
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-brand-700 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" /> Imprimir
                </button>
                <button
                  onClick={() => { URL.revokeObjectURL(docPreview.url); setDocPreview(null); }}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {/* Contenido del documento */}
            <div className="flex-1 bg-gray-100 p-4 overflow-auto">
              {docPreview.tipo.startsWith('image/') ? (
                <div className="flex items-center justify-center h-full">
                  <img src={docPreview.url} alt={docPreview.nombre} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                </div>
              ) : (
                <iframe src={docPreview.url} className="w-full h-full rounded-lg shadow-lg border-0 bg-white" title={docPreview.nombre} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
