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
  permiso_trabajo: 'Permiso de Trabajo',
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
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
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
          <div className="bg-white rounded-xl border shadow-sm p-6">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative group">
                {fotoUrl ? (
                  <img src={fotoUrl} alt={cliente.nombreCompleto} className="h-14 w-14 rounded-full object-cover border-2 border-brand-200" />
                ) : (
                  <div className="h-14 w-14 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-brand-600">
                      {cliente.nombreCompleto.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <label
                  htmlFor="foto-extranjero"
                  className="absolute -bottom-1 -right-1 h-6 w-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 cursor-pointer"
                  title="Subir foto"
                >
                  <Camera className="h-3 w-3 text-gray-500" />
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
                    className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 border border-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
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
                    try {
                      const formData = new FormData();
                      formData.append('file', file);
                      const res = await api.post(`/clientes/${clienteId}/foto`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                      setFotoUrl(res.data.fotoUrl || URL.createObjectURL(file));
                      toast.success('Foto subida exitosamente');
                    } catch {
                      // Fallback: mostrar preview local
                      setFotoUrl(URL.createObjectURL(file));
                      toast.success('Foto cargada (preview)');
                    }
                  }}
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {cliente.nombreCompleto}
                </h2>
                <p className="text-sm text-gray-500">
                  Extranjero desde {formatDate(cliente.createdAt)}
                </p>
              </div>
            </div>

            {/* Info Fields */}
            <div className="space-y-4">
              {/* Email */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
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
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
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
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Gestor asignado
                  </p>
                  {isAdmin && (
                    <button
                      onClick={async () => {
                        setReassigning(true);
                        try {
                          const res = await api.patch(`/clientes/${clienteId}/asesor`, { asesorId: 'auto' });
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
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Fecha de registro
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {formatDate(cliente.createdAt)}
                </p>
              </div>
            </div>

            {/* Pieza & Clave INM */}
            {(numeroPiezaINM || contrasenaINM) && (
              <div className="mt-6 pt-6 border-t space-y-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Datos INM
                </p>
                {numeroPiezaINM && (
                  <div>
                    <p className="text-xs text-gray-500">Pieza</p>
                    <p className="text-sm font-mono text-gray-900">
                      {numeroPiezaINM}
                    </p>
                  </div>
                )}
                {contrasenaINM && (
                  <div>
                    <p className="text-xs text-gray-500">Clave</p>
                    <p className="text-sm font-mono text-gray-900">
                      {contrasenaINM}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs - Right Side */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border shadow-sm">
            {/* Tab Navigation */}
            <div className="border-b">
              <nav className="flex">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-brand-500 text-brand-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
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
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-4 w-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.nombre}
                            </p>
                            <p className="text-xs text-gray-500">
                              {doc.categoria || 'Sin categoría'} •{' '}
                              {formatDate(doc.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ESTATUS_BADGE[doc.estatus] ??
                            'bg-gray-50 text-gray-700'
                          }`}
                        >
                          {doc.estatus.replace(/_/g, ' ')}
                        </span>
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
    </div>
  );
}
