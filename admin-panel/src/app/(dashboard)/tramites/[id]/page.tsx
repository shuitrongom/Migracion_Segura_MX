'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Circle, Clock, Plus, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import RequisitosUpload from '@/components/requisitos-upload';
import { DatePicker } from '@/components/ui/date-picker';

interface Etapa {
  id: string;
  nombre: string;
  orden: number;
  completada: boolean;
  observaciones: string | null;
  fechaCompletada: string | null;
}

interface Tarea {
  id: string;
  titulo: string;
  completada: boolean;
  asignado: string;
  createdAt: string;
}

interface TramiteDetail {
  id: string;
  numeroPieza: string;
  tipo: string;
  estatus: string;
  clienteId: string;
  clienteNombre: string;
  contrasenaTramite?: string;
  nut?: string;
  nutUrl?: string;
  fechaPresentacionInm?: string;
  datosFormulario?: Record<string, any>;
  etapas: Etapa[];
}

type EstatusTramite = 'borrador' | 'recibido' | 'en_revision' | 'presentado_inm' | 'en_espera_resolucion' | 'aprobado' | 'rechazado' | 'cancelado' | 'entregado' | 'completado';

const ESTATUS_OPTIONS: { value: EstatusTramite; label: string }[] = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'recibido', label: 'Recibido' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'presentado_inm', label: 'Presentado ante INM' },
  { value: 'en_espera_resolucion', label: 'En espera de resolución' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'entregado', label: 'Documento entregado' },
  { value: 'completado', label: 'Completado' },
];

const ESTATUS_BADGE: Record<EstatusTramite, string> = {
  borrador: 'bg-[#1a1a1a] text-white/70 border-[#3a3a3a]',
  recibido: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  en_revision: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  presentado_inm: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  en_espera_resolucion: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  aprobado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rechazado: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelado: 'bg-[#1a1a1a] text-white/70 border-[#3a3a3a]',
  entregado: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  completado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const ESTATUS_LABELS: Record<EstatusTramite, string> = {
  borrador: 'Borrador',
  recibido: 'Recibido',
  en_revision: 'En revisión',
  presentado_inm: 'Presentado ante INM',
  en_espera_resolucion: 'En espera',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
  entregado: 'Entregado',
  completado: 'Completado',
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

export default function TramiteDetailPage() {
  const params = useParams();
  const tramiteId = params.id as string;

  const [tramite, setTramite] = useState<TramiteDetail | null>(null);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estatus, setEstatus] = useState<EstatusTramite>('borrador');
  const [observaciones, setObservaciones] = useState('');
  const [newTarea, setNewTarea] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [tramiteRes, tareasRes] = await Promise.all([
          api.get(`/tramites/${tramiteId}`),
          api.get(`/tramites/${tramiteId}/tareas`),
        ]);
        setTramite(tramiteRes.data);
        setTareas(tareasRes.data);
        setEstatus((tramiteRes.data.estatus as EstatusTramite) || 'borrador');
      } catch {
        setError('Error al cargar los datos del trámite');
      } finally {
        setLoading(false);
      }
    }
    if (tramiteId) fetchData();
  }, [tramiteId]);

  const formatDateTime = (dateStr: string): string => {
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  };

  const handleChangeEstatus = async () => {
    try {
      await api.patch(`/tramites/${tramiteId}/estatus`, { estatus, observaciones: observaciones || undefined });
      setObservaciones('');
    } catch { /* ignore */ }
  };

  const handleAddTarea = async () => {
    if (!newTarea.trim()) return;
    try {
      const res = await api.post(`/tramites/${tramiteId}/tareas`, { titulo: newTarea.trim() });
      setTareas([...tareas, res.data]);
      setNewTarea('');
    } catch { /* ignore */ }
  };

  const handleToggleTarea = async (id: string) => {
    try {
      await api.patch(`/tramites/tareas/${id}/completar`);
      setTareas(tareas.map(t => t.id === id ? { ...t, completada: !t.completada } : t));
    } catch { /* ignore */ }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-amber-500 animate-spin" /></div>;
  }

  if (error || !tramite) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Link href="/tramites" className="p-2 rounded-lg hover:bg-[#222222] text-white/70"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold text-white">Detalle del Trámite</h1>
        </div>
        <div className="dark-card-static p-12 text-center">
          <p className="text-sm text-white/70">{error || 'No se encontró el trámite'}</p>
        </div>
      </div>
    );
  }

  const etapas = tramite.etapas || [];
  const currentEtapaIndex = etapas.findIndex(e => !e.completada);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/tramites" className="p-2 rounded-lg hover:bg-[#222222] text-white/70"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{tramite.numeroPieza || tramite.id}</h1>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${ESTATUS_BADGE[estatus] || ESTATUS_BADGE.borrador}`}>{ESTATUS_LABELS[estatus] || estatus}</span>
          </div>
          <p className="text-sm text-white/70 mt-1">
            {TIPO_LABELS[tramite.tipo] || tramite.tipo}{tramite.clienteNombre && ` · Cliente: ${tramite.clienteNombre}`}
            {tramite?.datosFormulario?.ubicacionOrigen && (
              <span className="text-xs text-white/70 ml-3">📍 {(tramite.datosFormulario as any).ubicacionOrigen.ciudad || ''}</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Etapas */}
          <div className="dark-card-static p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Etapas del trámite</h2>
            {etapas.length === 0 ? (
              <p className="text-sm text-white/70 text-center py-8">No hay etapas registradas para este trámite.</p>
            ) : (
              <div className="space-y-0">
                {etapas.map((etapa, index) => {
                  const isCurrent = index === currentEtapaIndex;
                  return (
                    <div key={etapa.id} className="relative flex gap-4">
                      {index < etapas.length - 1 && <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${etapa.completada ? 'bg-green-300' : 'bg-[#262626]'}`} />}
                      <div className="relative z-10 flex-shrink-0">
                        {etapa.completada ? (
                          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center"><Check className="h-4 w-4 text-white" /></div>
                        ) : isCurrent ? (
                          <div className="h-8 w-8 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center"><Clock className="h-4 w-4 text-amber-500" /></div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-[#222222] border-2 border-[#3a3a3a] flex items-center justify-center"><Circle className="h-3 w-3 text-white/70" /></div>
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${etapa.completada ? 'text-white' : isCurrent ? 'text-amber-400' : 'text-white/70'}`}>{etapa.nombre}</p>
                          {isCurrent && <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-medium">Actual</span>}
                        </div>
                        {etapa.fechaCompletada && <p className="text-xs text-white/70 mt-0.5">{formatDateTime(etapa.fechaCompletada)}</p>}
                        {etapa.observaciones && <p className="text-sm text-white/70 mt-2 bg-[#1a1a1a] rounded-lg p-3">{etapa.observaciones}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Requisitos documentales - Upload */}
          <div className="dark-card-static p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Requisitos documentales</h2>
            <RequisitosUpload tramiteId={tramiteId} tipoTramite={tramite.tipo} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Botón continuar trámite (Caso B: extranjero ya lo creó, gestor continúa) */}
          {tramite && !tramite.numeroPieza && (estatus === 'recibido' || estatus === 'borrador') && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-amber-300 mb-2">Trámite pendiente de gestión</h3>
              <p className="text-xs text-amber-200/80 mb-4">Este trámite fue iniciado por el extranjero. Continúa con la solicitud ante el INM.</p>
              <Link href={`/tramites/continuar/${tramiteId}`} className="block w-full px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 text-center transition-colors">
                Continuar trámite →
              </Link>
            </div>
          )}
          {/* Cambiar estatus */}
          <div className="dark-card-static p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Cambiar estatus</h3>
            <div className="space-y-3">
              <select value={estatus} onChange={(e) => setEstatus(e.target.value as EstatusTramite)} className="w-full px-3 py-2.5 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" aria-label="Nuevo estatus">
                {ESTATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full px-3 py-2.5 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" placeholder="Observaciones (opcional)" rows={3} />
              <button onClick={handleChangeEstatus} className="w-full px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">Actualizar estatus</button>
            </div>
          </div>

          {/* Pagos del trámite */}
          <PagosDelTramite tramiteId={tramiteId} clienteId={tramite?.clienteId} />

          {/* Resolución y Cita (embajada/INM) */}
          <ResolucionCitaSection tramiteId={tramiteId} tramite={tramite} />

          {/* Pieza INM + NUT */}
          <DatosINMSection tramiteId={tramiteId} tramite={tramite} estatus={estatus} />

          {/* Datos del promovente/extranjero */}
          {tramite?.datosFormulario && (
            <div className="dark-card-static p-6">
              <h3 className="text-sm font-semibold text-white mb-4">📋 Datos del promovente</h3>
              <div className="space-y-2">
                {tramite.datosFormulario.nombre && (
                  <div className="flex justify-between">
                    <span className="text-[10px] text-white/50 uppercase">Nombre</span>
                    <span className="text-sm text-white font-medium">{String(tramite.datosFormulario.nombre)} {String(tramite.datosFormulario.apellidos || '')}</span>
                  </div>
                )}
                {tramite.datosFormulario.nacionalidad && (
                  <div className="flex justify-between">
                    <span className="text-[10px] text-white/50 uppercase">Nacionalidad</span>
                    <span className="text-sm text-white">{String(tramite.datosFormulario.nacionalidad)}</span>
                  </div>
                )}
                {tramite.datosFormulario.documentoIdentificacion && (
                  <div className="flex justify-between">
                    <span className="text-[10px] text-white/50 uppercase">Documento</span>
                    <span className="text-sm text-white">{String(tramite.datosFormulario.documentoIdentificacion)}</span>
                  </div>
                )}
                {tramite.datosFormulario.numeroDocumento && (
                  <div className="flex justify-between">
                    <span className="text-[10px] text-white/50 uppercase">Nº Documento</span>
                    <span className="text-sm text-white font-mono">{String(tramite.datosFormulario.numeroDocumento)}</span>
                  </div>
                )}
                {tramite.datosFormulario.curpExtranjero && (
                  <div className="flex justify-between">
                    <span className="text-[10px] text-white/50 uppercase">CURP</span>
                    <span className="text-sm text-white font-mono">{String(tramite.datosFormulario.curpExtranjero)}</span>
                  </div>
                )}
                {tramite.datosFormulario.sexo && (
                  <div className="flex justify-between">
                    <span className="text-[10px] text-white/50 uppercase">Sexo</span>
                    <span className="text-sm text-white">{tramite.datosFormulario.sexo === 'H' ? 'Hombre' : tramite.datosFormulario.sexo === 'M' ? 'Mujer' : String(tramite.datosFormulario.sexo)}</span>
                  </div>
                )}
                {tramite.datosFormulario.fechaNacimiento && (
                  <div className="flex justify-between">
                    <span className="text-[10px] text-white/50 uppercase">Fecha nacimiento</span>
                    <span className="text-sm text-white">{String(tramite.datosFormulario.fechaNacimiento)}</span>
                  </div>
                )}
                {tramite.datosFormulario.estadoCivil && (
                  <div className="flex justify-between">
                    <span className="text-[10px] text-white/50 uppercase">Estado civil</span>
                    <span className="text-sm text-white">{String(tramite.datosFormulario.estadoCivil)}</span>
                  </div>
                )}
                {tramite.datosFormulario.paisNacimiento && (
                  <div className="flex justify-between">
                    <span className="text-[10px] text-white/50 uppercase">País de nacimiento</span>
                    <span className="text-sm text-white">{String(tramite.datosFormulario.paisNacimiento)}</span>
                  </div>
                )}
                {tramite.datosFormulario.paisExpedicion && (
                  <div className="flex justify-between">
                    <span className="text-[10px] text-white/50 uppercase">País expedición</span>
                    <span className="text-sm text-white">{String(tramite.datosFormulario.paisExpedicion)}</span>
                  </div>
                )}
                {tramite.datosFormulario.fechaExpedicion && (
                  <div className="flex justify-between">
                    <span className="text-[10px] text-white/50 uppercase">Fecha expedición</span>
                    <span className="text-sm text-white">{String(tramite.datosFormulario.fechaExpedicion)}</span>
                  </div>
                )}
                {tramite.datosFormulario.fechaVencimiento && (
                  <div className="flex justify-between">
                    <span className="text-[10px] text-white/50 uppercase">Fecha vencimiento</span>
                    <span className="text-sm text-white">{String(tramite.datosFormulario.fechaVencimiento)}</span>
                  </div>
                )}
                {(tramite.datosFormulario.domCalle || tramite.datosFormulario.domColonia) && (
                  <div>
                    <span className="text-[10px] text-white/50 uppercase">Domicilio</span>
                    <p className="text-sm text-white mt-0.5">
                      {[tramite.datosFormulario.domCalle, tramite.datosFormulario.domNumeroExterior, tramite.datosFormulario.domColonia, tramite.datosFormulario.domMunicipio, tramite.datosFormulario.domEstado, tramite.datosFormulario.domCodigoPostal].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                {tramite.datosFormulario.telefono && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-white/50 uppercase">WhatsApp</span>
                    <a href={`https://wa.me/${String(tramite.datosFormulario.telefono).replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[10px] font-semibold text-[#25D366]">
                      💬 {String(tramite.datosFormulario.telefono)}
                    </a>
                  </div>
                )}
                {tramite.datosFormulario.solicitanteEmail && (
                  <div className="flex justify-between">
                    <span className="text-[10px] text-white/50 uppercase">Email</span>
                    <span className="text-sm text-white">{String(tramite.datosFormulario.solicitanteEmail)}</span>
                  </div>
                )}
              </div>

              {/* Datos del solicitante/persona física (visa) */}
              {tramite.datosFormulario.solicitante && typeof tramite.datosFormulario.solicitante === 'object' && (tramite.datosFormulario.solicitante as any).nombre && (
                <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                  <h4 className="text-[10px] font-semibold text-amber-500 uppercase mb-3">Datos del solicitante (persona física/moral)</h4>
                  <div className="space-y-2">
                    {(tramite.datosFormulario.solicitante as any).nombre && (
                      <div className="flex justify-between">
                        <span className="text-[10px] text-white/50 uppercase">Nombre</span>
                        <span className="text-sm text-white">{String((tramite.datosFormulario.solicitante as any).nombre)} {String((tramite.datosFormulario.solicitante as any).apellidos || '')}</span>
                      </div>
                    )}
                    {(tramite.datosFormulario.solicitante as any).tipoPersona && (
                      <div className="flex justify-between">
                        <span className="text-[10px] text-white/50 uppercase">Tipo persona</span>
                        <span className="text-sm text-white">{String((tramite.datosFormulario.solicitante as any).tipoPersona)}</span>
                      </div>
                    )}
                    {(tramite.datosFormulario.solicitante as any).curp && (
                      <div className="flex justify-between">
                        <span className="text-[10px] text-white/50 uppercase">CURP</span>
                        <span className="text-sm text-white font-mono">{String((tramite.datosFormulario.solicitante as any).curp)}</span>
                      </div>
                    )}
                    {(tramite.datosFormulario.solicitante as any).rfc && (
                      <div className="flex justify-between">
                        <span className="text-[10px] text-white/50 uppercase">RFC</span>
                        <span className="text-sm text-white font-mono">{String((tramite.datosFormulario.solicitante as any).rfc)}</span>
                      </div>
                    )}
                    {(tramite.datosFormulario.solicitante as any).vinculoParentesco && (
                      <div className="flex justify-between">
                        <span className="text-[10px] text-white/50 uppercase">Vínculo</span>
                        <span className="text-sm text-white">{String((tramite.datosFormulario.solicitante as any).vinculoParentesco)}</span>
                      </div>
                    )}
                    {((tramite.datosFormulario.solicitante as any).calle || (tramite.datosFormulario.solicitante as any).colonia) && (
                      <div>
                        <span className="text-[10px] text-white/50 uppercase">Domicilio solicitante</span>
                        <p className="text-sm text-white mt-0.5">
                          {[(tramite.datosFormulario.solicitante as any).calle, (tramite.datosFormulario.solicitante as any).numeroExterior, (tramite.datosFormulario.solicitante as any).colonia, (tramite.datosFormulario.solicitante as any).municipio, (tramite.datosFormulario.solicitante as any).estado, (tramite.datosFormulario.solicitante as any).codigoPostal].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                    {(tramite.datosFormulario.solicitante as any).telefonoFijo && (
                      <div className="flex justify-between">
                        <span className="text-[10px] text-white/50 uppercase">Teléfono</span>
                        <span className="text-sm text-white">{String((tramite.datosFormulario.solicitante as any).telefonoFijo)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResolucionCitaSection({ tramiteId, tramite }: { tramiteId: string; tramite: TramiteDetail }) {
  const [resolucionFile, setResolucionFile] = useState<File | null>(null);
  const [citaFecha, setCitaFecha] = useState('');
  const [citaLugar, setCitaLugar] = useState('');
  const [citaNotas, setCitaNotas] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fechaVencimientoDoc, setFechaVencimientoDoc] = useState('');

  const handleUploadResolucion = async () => {
    if (!resolucionFile) { toast.error('Selecciona un archivo de resolución'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', resolucionFile);
      formData.append('tramiteId', tramiteId);
      formData.append('categoria', 'resolucion');
      formData.append('nombre', `Resolución - ${resolucionFile.name}`);
      await api.post('/documentos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      // Notificar al extranjero
      await api.patch(`/tramites/${tramiteId}/estatus`, {
        estatus: tramite?.estatus === 'en_espera_resolucion' ? 'aprobado' : tramite?.estatus,
        observaciones: 'Se ha subido la resolución del trámite.',
      });

      toast.success('Resolución subida y extranjero notificado');
      setResolucionFile(null);
    } catch {
      toast.error('Error al subir la resolución');
    } finally {
      setUploading(false);
    }
  };

  const handleRegistrarCita = async () => {
    if (!citaFecha) { toast.error('Indica la fecha de la cita'); return; }
    setUploading(true);
    try {
      // Guardar cita en datos del trámite
      await api.patch(`/tramites/${tramiteId}/continuar`, {
        datosFormulario: {
          ...tramite?.datosFormulario,
          citaEmbajada: { fecha: citaFecha, lugar: citaLugar, notas: citaNotas },
        },
      });

      // Notificar cambio de estatus y cita
      await api.patch(`/tramites/${tramiteId}/estatus`, {
        estatus: tramite?.estatus || 'en_espera_resolucion',
        observaciones: `Cita programada: ${citaFecha}${citaLugar ? ` en ${citaLugar}` : ''}. ${citaNotas}`,
      });

      toast.success('Cita registrada y extranjero notificado');
      setCitaFecha('');
      setCitaLugar('');
      setCitaNotas('');
    } catch {
      toast.error('Error al registrar la cita');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dark-card-static p-6">
      <h3 className="text-sm font-semibold text-white mb-4">📋 Resolución / Cita embajada</h3>
      <div className="space-y-4">
        {/* Subir resolución */}
        <div className="p-3 rounded-lg border border-[#3a3a3a] bg-[#1a1a1a]">
          <p className="text-[10px] text-white/70 uppercase font-semibold mb-2">Subir resolución</p>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setResolucionFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-white/70 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#252525] file:text-white/70 hover:file:bg-[#333333] file:cursor-pointer border border-[#3a3a3a] rounded-lg bg-[#1a1a1a] py-1.5 px-2"
          />
          {resolucionFile && <p className="text-[10px] text-emerald-400 mt-1">✓ {resolucionFile.name}</p>}
          <button
            onClick={handleUploadResolucion}
            disabled={uploading || !resolucionFile}
            className="w-full mt-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Subiendo...' : '📤 Subir resolución y notificar'}
          </button>
        </div>

        {/* Registrar cita */}
        <div className="p-3 rounded-lg border border-[#3a3a3a] bg-[#1a1a1a]">
          <p className="text-[10px] text-white/70 uppercase font-semibold mb-2">Registrar cita (embajada/INM)</p>
          <div className="space-y-2">
            <input
              type="datetime-local"
              value={citaFecha}
              onChange={(e) => setCitaFecha(e.target.value)}
              className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <input
              type="text"
              value={citaLugar}
              onChange={(e) => setCitaLugar(e.target.value)}
              className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              placeholder="Lugar (ej: Embajada de México en...)"
            />
            <textarea
              value={citaNotas}
              onChange={(e) => setCitaNotas(e.target.value)}
              className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              placeholder="Notas adicionales (documentos a llevar, etc.)"
              rows={2}
            />
            <button
              onClick={handleRegistrarCita}
              disabled={uploading || !citaFecha}
              className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Guardando...' : '📅 Registrar cita y notificar'}
            </button>
          </div>
        </div>

        {/* Cita existente */}
        {(tramite?.datosFormulario as any)?.citaEmbajada && (
          <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
            <p className="text-[10px] text-emerald-400 uppercase font-semibold mb-1">✅ Cita registrada</p>
            <p className="text-sm text-white font-medium">{(tramite.datosFormulario as any).citaEmbajada.fecha}</p>
            {(tramite.datosFormulario as any).citaEmbajada.lugar && <p className="text-xs text-white/70 mt-0.5">📍 {(tramite.datosFormulario as any).citaEmbajada.lugar}</p>}
            {(tramite.datosFormulario as any).citaEmbajada.notas && <p className="text-xs text-white/50 mt-0.5">{(tramite.datosFormulario as any).citaEmbajada.notas}</p>}
          </div>
        )}

        {/* Subir documento migratorio con vencimiento */}
        <div className="p-3 rounded-lg border border-[#3a3a3a] bg-[#1a1a1a]">
          <p className="text-[10px] text-white/70 uppercase font-semibold mb-2">📋 Documento migratorio (resultado del trámite)</p>
          <p className="text-[10px] text-white/50 mb-2">Sube el documento migratorio obtenido y su fecha de vencimiento para alertar al extranjero 30 días antes.</p>
          <div className="space-y-2">
            <DatePicker
              value={fechaVencimientoDoc}
              onChange={setFechaVencimientoDoc}
              placeholder="Fecha de vencimiento del documento"
              yearRange={[2025, 2040]}
              disablePast
            />
            <input
              type="file"
              id={`doc-migratorio-${tramiteId}`}
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full text-xs text-white/70 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#252525] file:text-white/70 hover:file:bg-[#333333] file:cursor-pointer border border-[#3a3a3a] rounded-lg bg-[#1a1a1a] py-1.5 px-2"
            />
            <button
              onClick={async () => {
                const fileInput = document.getElementById(`doc-migratorio-${tramiteId}`) as HTMLInputElement;
                const file = fileInput?.files?.[0];
                const fecha = fechaVencimientoDoc;
                if (!file) { toast.error('Selecciona el documento migratorio'); return; }
                if (!fecha) { toast.error('Indica la fecha de vencimiento'); return; }
                try {
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('tramiteId', tramiteId);
                  formData.append('categoria', 'forma_migratoria');
                  formData.append('nombre', `Documento migratorio - ${file.name}`);
                  formData.append('fechaVencimiento', fecha);
                  await api.post('/documentos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                  toast.success('Documento migratorio subido. Se alertará 30 días antes del vencimiento.');
                } catch { toast.error('Error al subir'); }
              }}
              className="w-full px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
            >
              📄 Subir documento migratorio + vencimiento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DatosINMSection({ tramiteId, tramite, estatus }: { tramiteId: string; tramite: TramiteDetail; estatus: EstatusTramite }) {
  const [pdfSolicitudOpen, setPdfSolicitudOpen] = useState(false);
  const [pdfNutOpen, setPdfNutOpen] = useState(false);
  const [nutPdfFile, setNutPdfFile] = useState<File | null>(null);
  const nutFileRef = useRef<HTMLInputElement>(null);

  const handleRegistrarNut = async () => {
    const nutValue = (document.getElementById('nut-input') as HTMLInputElement)?.value;
    if (!nutValue?.trim()) { toast.error('Ingresa el NUT'); return; }
    try {
      // Upload NUT PDF if provided
      if (nutPdfFile) {
        const formData = new FormData();
        formData.append('file', nutPdfFile);
        formData.append('tramiteId', tramiteId);
        formData.append('categoria', 'nut');
        formData.append('nombre', `NUT_${nutValue.trim()}.pdf`);
        await api.post('/documentos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      await api.patch(`/tramites/${tramiteId}/continuar`, { datosFormulario: { ...tramite?.datosFormulario, nut: nutValue.trim() } });
      await api.patch(`/tramites/${tramiteId}/estatus`, { estatus: 'en_espera_resolucion', observaciones: `NUT registrado: ${nutValue.trim()}. Trámite presentado ante INM.` });
      toast.success('NUT registrado. Se notificó al extranjero.');
      window.location.reload();
    } catch { toast.error('Error al registrar NUT'); }
  };

  return (
    <>
      <div className="dark-card-static p-6">
        <h3 className="text-sm font-semibold text-white mb-4">📋 Datos INM</h3>
        <div className="space-y-3">
          {/* Pieza */}
          <div className="p-3 rounded-lg border border-[#3a3a3a] bg-[#1a1a1a]">
            <p className="text-[10px] text-white/70 uppercase font-semibold">Número de Pieza</p>
            <div className="flex items-center justify-between">
              <p className="text-lg font-mono font-bold text-amber-400">{tramite?.numeroPieza || '—'}</p>
              {tramite?.numeroPieza && !tramite.numeroPieza.startsWith('MSX-') && (
                <button
                  onClick={() => setPdfSolicitudOpen(true)}
                  className="px-2.5 py-1 text-[11px] font-medium text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-colors"
                >
                  📄 Ver PDF Solicitud
                </button>
              )}
            </div>
          </div>

          {/* Clave INM */}
          <div className="p-3 rounded-lg border border-[#3a3a3a] bg-[#1a1a1a]">
            <p className="text-[10px] text-white/70 uppercase font-semibold">Clave INM</p>
            <p className="text-lg font-mono font-bold text-amber-400">{tramite?.contrasenaTramite || '—'}</p>
          </div>

          {/* NUT */}
          <div className="p-3 rounded-lg border border-[#3a3a3a] bg-[#1a1a1a]">
            <p className="text-[10px] text-white/70 uppercase font-semibold">NUT (Número Único de Trámite)</p>
            {tramite?.nut ? (
              <div className="flex items-center justify-between mt-1">
                <p className="text-lg font-mono font-bold text-emerald-400">{tramite.nut}</p>
                <button
                  onClick={() => setPdfNutOpen(true)}
                  className="px-2.5 py-1 text-[11px] font-medium text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10 transition-colors"
                >
                  📄 Ver PDF NUT
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-xs text-white/70 italic mb-2">No registrado aún</p>
                {(estatus === 'presentado_inm' || estatus === 'en_revision') && (
                  <div className="space-y-2">
                    <input type="text" id="nut-input" className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" placeholder="Ingresa el NUT..." />
                    <div>
                      <label className="text-[10px] text-white/70 uppercase font-semibold block mb-1">PDF del NUT (opcional)</label>
                      <input
                        ref={nutFileRef}
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setNutPdfFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-white/70 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#252525] file:text-white/70 hover:file:bg-[#333333] file:cursor-pointer border border-[#3a3a3a] rounded-lg bg-[#1a1a1a] py-1.5 px-2"
                      />
                      {nutPdfFile && <p className="text-[10px] text-emerald-400 mt-1">✓ {nutPdfFile.name}</p>}
                    </div>
                    <button
                      onClick={handleRegistrarNut}
                      className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                    >
                      Registrar NUT y notificar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Modals */}
      <PdfViewerModal
        isOpen={pdfSolicitudOpen}
        onClose={() => setPdfSolicitudOpen(false)}
        title="PDF Solicitud - Pieza"
        tramiteId={tramiteId}
        categoria="solicitud"
      />
      <PdfViewerModal
        isOpen={pdfNutOpen}
        onClose={() => setPdfNutOpen(false)}
        title="PDF NUT"
        tramiteId={tramiteId}
        categoria="nut"
      />
    </>
  );
}

function PdfViewerModal({ isOpen, onClose, title, tramiteId, categoria }: { isOpen: boolean; onClose: () => void; title: string; tramiteId: string; categoria: string }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.get(`/documentos?tramiteId=${tramiteId}&categoria=${categoria}`)
      .then(res => {
        const docs = res.data?.data || res.data || [];
        if (docs.length > 0) {
          return api.get(`/documentos/${docs[0].id}/download`, { responseType: 'blob' });
        }
        return null;
      })
      .then(res => {
        if (res) {
          const blob = new Blob([res.data], { type: 'application/pdf' });
          setPdfUrl(URL.createObjectURL(blob));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tramiteId, categoria]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#171717] rounded-2xl shadow-2xl w-full max-w-4xl mx-4 h-[85vh] flex flex-col border border-[#3a3a3a]">
        <div className="flex items-center justify-between p-4 border-b border-[#3a3a3a]">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <div className="flex items-center gap-2">
            {pdfUrl && <button onClick={() => window.open(pdfUrl, '_blank')} className="px-3 py-1.5 text-xs font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600">Imprimir</button>}
            <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-white/70 border border-[#3a3a3a] rounded-lg hover:bg-[#222222]">Cerrar</button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden rounded-b-2xl bg-[#222222]">
          {loading ? (
            <div className="flex items-center justify-center h-full"><p className="text-white/70">Cargando PDF...</p></div>
          ) : pdfUrl ? (
            <iframe src={pdfUrl} className="w-full h-full border-0" title={title} />
          ) : (
            <div className="flex items-center justify-center h-full"><p className="text-white/70">No se encontró el PDF</p></div>
          )}
        </div>
      </div>
    </div>
  );
}

function PagosDelTramite({ tramiteId, clienteId }: { tramiteId: string; clienteId?: string }) {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPagos() {
      try {
        const res = await api.get(`/financiero/pagos/tramite/${tramiteId}`);
        setPagos(res.data?.data || res.data || []);
      } catch {
        setPagos([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPagos();
  }, [tramiteId]);

  const formatCurrency = (n: number) => `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const ESTATUS_PAGO: Record<string, { label: string; color: string }> = {
    pendiente: { label: 'Pendiente', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    aprobado: { label: 'Pagado', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    rechazado: { label: 'Rechazado', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    cancelado: { label: 'Cancelado', color: 'bg-[#222222] text-white/70 border-[#3a3a3a]' },
    reembolsado: { label: 'Reembolsado', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  };

  const TIPO_PAGO: Record<string, string> = {
    anticipo: 'Anticipo (50%)',
    liquidacion: 'Liquidación (50%)',
    pago_unico: 'Pago único',
  };

  return (
    <div className="dark-card-static p-6">
      <h3 className="text-sm font-semibold text-white mb-4">💳 Pagos del trámite</h3>
      {loading ? (
        <p className="text-sm text-white/70 text-center py-4">Cargando pagos...</p>
      ) : pagos.length === 0 ? (
        <p className="text-sm text-white/70 text-center py-4">No hay pagos registrados para este trámite.</p>
      ) : (
        <div className="space-y-3">
          {pagos.map((pago: any) => {
            const estatus = ESTATUS_PAGO[pago.estatusPago || pago.estatus_pago] || ESTATUS_PAGO.pendiente;
            const tipo = TIPO_PAGO[pago.tipoPago || pago.tipo_pago] || 'Pago';
            return (
              <div key={pago.id} className="p-3 rounded-lg border border-[#3a3a3a] bg-[#1a1a1a]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white/70">{tipo}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${estatus.color}`}>{estatus.label}</span>
                </div>
                <p className="text-lg font-bold text-white">{formatCurrency(pago.monto)}</p>
                <p className="text-xs text-white/70 mt-1">{pago.concepto}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-white/70">
                  {pago.fechaPago && <span>Pagado: {formatDate(pago.fechaPago)}</span>}
                  {pago.fechaVencimiento && <span>Vence: {formatDate(pago.fechaVencimiento)}</span>}
                </div>
                {/* Acciones de pago pendiente */}
                {pago.mercadopagoInitPoint && (pago.estatusPago === 'pendiente' || pago.estatus_pago === 'pendiente') && (
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#2a2a2a]">
                    <a href={pago.mercadopagoInitPoint} target="_blank" rel="noopener noreferrer" className="flex-1 text-center px-3 py-1.5 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-colors">
                      🔗 Ver link de pago
                    </a>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(pago.mercadopagoInitPoint);
                          toast.success('Link copiado al portapapeles');
                        } catch {
                          window.open(pago.mercadopagoInitPoint, '_blank');
                        }
                      }}
                      className="px-3 py-1.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors"
                    >📋 Copiar</button>
                    <button
                      onClick={async () => {
                        try {
                          // Reenviar notificación push al extranjero con el link
                          await api.post(`/financiero/pagos/reenviar-link`, { tramiteId, pagoId: pago.id });
                          toast.success('Link de pago reenviado al extranjero');
                        } catch {
                          toast.error('Error al reenviar. Copia el link y envíalo por WhatsApp.');
                        }
                      }}
                      className="px-3 py-1.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
                    >📲 Reenviar</button>
                  </div>
                )}
                {/* Admin: subir comprobante de pago (OXXO/transferencia) en nombre del extranjero */}
                {(pago.estatusPago === 'pendiente' || pago.estatus_pago === 'pendiente') && (
                  <AdminComprobanteUpload pagoId={pago.id} monto={pago.monto} onSuccess={() => window.location.reload()} />
                )}
              </div>
            );
          })}
          {/* Total */}
          <div className="pt-2 border-t border-[#3a3a3a] flex items-center justify-between">
            <span className="text-xs font-semibold text-white/70">Monto total del trámite</span>
            <span className="text-sm font-bold text-amber-400">{formatCurrency(pagos[0]?.montoTotalTramite || pagos.reduce((sum: number, p: any) => sum + Number(p.monto), 0))}</span>
          </div>
        </div>
      )}

      {/* Info: pagos controlados por el sistema */}
      <div className="mt-4 pt-4 border-t border-[#3a3a3a]">
        {/* Botón generar siguiente pago (si hay pendientes sin link) */}
        {pagos.some((p: any) => p.estatusPago === 'pendiente' && !p.mercadopagoInitPoint) && (
          <button
            onClick={async () => {
              try {
                // Obtener datos del extranjero
                const tramiteRes = await api.get(`/tramites/${tramiteId}`);
                const t = tramiteRes.data;
                const nombre = t?.cliente?.nombreCompleto || `${t?.datosFormulario?.nombre || ''} ${t?.datosFormulario?.apellidos || ''}`.trim() || 'Extranjero';
                const email = t?.cliente?.email || t?.datosFormulario?.solicitanteEmail || '';

                await api.post('/financiero/pagos/generar-liquidacion', {
                  tramiteId,
                  clienteNombre: nombre,
                  email,
                });
                toast.success('Link de pago generado y enviado al extranjero');
                window.location.reload();
              } catch (err: any) {
                toast.error(err?.response?.data?.message || 'Error al generar link de pago');
              }
            }}
            className="w-full mb-3 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            💳 Generar y enviar siguiente pago
          </button>
        )}

        <div className="p-3 rounded-lg bg-blue-500/[0.05] border border-blue-500/20">
          <p className="text-[11px] text-blue-400 font-medium">🔒 Módulo financiero blindado</p>
          <p className="text-[10px] text-white/50 mt-1">Los pagos solo se registran automáticamente vía Mercado Pago o por transferencia con voucher verificado. No se permiten registros manuales para evitar discrepancias.</p>
        </div>
      </div>
    </div>
  );
}

function AdminComprobanteUpload({ pagoId, monto, onSuccess }: { pagoId: string; monto: number; onSuccess: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [metodoPago, setMetodoPago] = useState('transferencia_bancaria');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!file) { toast.error('Selecciona el comprobante de pago'); return; }
    setUploading(true);
    try {
      // 1. Subir archivo como documento
      const formData = new FormData();
      formData.append('file', file);
      formData.append('nombre', `Comprobante pago - ${metodoPago === 'crypto' ? 'Crypto' : 'Transferencia/OXXO'}`);
      formData.append('categoria', 'comprobante_pago');
      const uploadRes = await api.post('/documentos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const voucherUrl = uploadRes.data?.storageKey || uploadRes.data?.id || 'admin-uploaded';

      // 2. Confirmar pago en un solo paso (sin validación de monto exacto)
      await api.post(`/financiero/pagos/${pagoId}/confirmar-pago-admin`, {
        voucherUrl,
        metodoPago,
        nota: 'Comprobante subido y aprobado por administrador',
      });

      toast.success('✅ Pago confirmado correctamente');
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al registrar el comprobante'));
    } finally {
      setUploading(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full mt-2 px-3 py-1.5 text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition-colors"
      >
        🧾 Subir comprobante (OXXO/transferencia)
      </button>
    );
  }

  return (
    <div className="mt-3 p-3 rounded-lg border border-orange-500/30 bg-orange-500/5 space-y-2">
      <p className="text-[10px] text-orange-400 uppercase font-semibold">Subir comprobante de pago</p>
      <select
        value={metodoPago}
        onChange={(e) => setMetodoPago(e.target.value)}
        className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30"
      >
        <option value="transferencia_bancaria">Transferencia bancaria</option>
        <option value="efectivo">Efectivo (OXXO/depósito)</option>
        <option value="crypto">Crypto/USDT</option>
      </select>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="w-full text-xs text-white/70 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#252525] file:text-white/70 hover:file:bg-[#333333] file:cursor-pointer border border-[#3a3a3a] rounded-lg bg-[#1a1a1a] py-1 px-2"
      />
      {file && <p className="text-[10px] text-emerald-400">✓ {file.name}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={uploading || !file}
          className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 disabled:opacity-50"
        >
          {uploading ? 'Subiendo...' : '✓ Confirmar pago'}
        </button>
        <button
          onClick={() => { setShowForm(false); setFile(null); }}
          className="px-3 py-2 text-xs text-white/70 border border-[#3a3a3a] rounded-lg hover:bg-[#222222]"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
