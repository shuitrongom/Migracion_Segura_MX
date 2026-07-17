'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, FileText, ClipboardList, ExternalLink, Upload, Key, Loader2, Copy } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '@/lib/api';

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
    <button type="button" onClick={handleCopy} className="w-full text-left p-1.5 rounded hover:bg-[#252525] border border-transparent hover:border-[#3a3a3a] transition-all group">
      {label && <p className="text-[10px] text-white/70">{label}</p>}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white">{displayValue}</p>
        <Copy className="h-3 w-3 text-gray-300 group-hover:text-amber-500" />
      </div>
    </button>
  );
}

interface Requisito { nombre: string; obligatorio: boolean; descripcion: string; }

const STEPS = ['Solicitud INM', 'Requisitos', 'Pago'];

export default function ContinuarTramitePage() {
  const params = useParams();
  const tramiteId = params.id as string;
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tramite, setTramite] = useState<any>(null);
  const [numeroPieza, setNumeroPieza] = useState('');
  const [contrasenaINM, setContrasenaINM] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pagoData, setPagoData] = useState({ concepto: '', monto: '', metodoPago: '', referencia: '', email: '', numeroPagos: '2' });
  const [requisitosSeleccionados, setRequisitosSeleccionados] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(`/tramites/${tramiteId}`);
        setTramite(res.data);
        const reqRes = await api.get(`/tramites/requisitos/${res.data.tipo}`);
        setRequisitos(reqRes.data || []);
        // Pre-seleccionar los requisitos obligatorios automáticamente
        const reqs = reqRes.data || [];
        const obligatorios = new Set<number>();
        reqs.forEach((r: any, i: number) => { if (r.obligatorio) obligatorios.add(i); });
        setRequisitosSeleccionados(obligatorios);

        // Determinar en qué paso retomar según etapaGestion guardada
        const etapa = res.data.datosFormulario?.etapaGestion;
        if (etapa === 'finalizado') {
          router.push(`/tramites/${tramiteId}`);
          return;
        } else if (etapa === 'pago') {
          setNumeroPieza(res.data.numeroPieza || res.data.datosFormulario?.numeroPiezaINM || '');
          setContrasenaINM(res.data.contrasenaTramite || res.data.datosFormulario?.contrasenaINM || '');
          setStep(2);
        } else if (etapa === 'requisitos') {
          setNumeroPieza(res.data.numeroPieza || res.data.datosFormulario?.numeroPiezaINM || '');
          setContrasenaINM(res.data.contrasenaTramite || res.data.datosFormulario?.contrasenaINM || '');
          setStep(1);
        } else if (res.data.numeroPieza && !res.data.numeroPieza.startsWith('MSX-')) {
          setNumeroPieza(res.data.numeroPieza);
          setContrasenaINM(res.data.contrasenaTramite || '');
          setStep(1);
        }
      } catch {
        toast.error('Error al cargar el trámite');
      } finally {
        setLoading(false);
      }
    }
    if (tramiteId) fetchData();
  }, [tramiteId]);

  // Guardar etapa de gestión en la BD
  const saveEtapa = async (etapa: string) => {
    try {
      await api.patch(`/tramites/${tramiteId}/continuar`, {
        datosFormulario: { ...tramite?.datosFormulario, etapaGestion: etapa },
      });
    } catch {} // No bloquear si falla
  };

  const handleNext = async () => {
    if (step === 0) {
      if (!numeroPieza.trim()) { toast.error('Ingresa el número de pieza'); return; }
      if (!contrasenaINM.trim()) { toast.error('Ingresa la clave del INM'); return; }
      if (!pdfFile) { toast.error('Sube el PDF de la solicitud'); return; }

      try {
        await api.patch(`/tramites/${tramiteId}/continuar`, {
          numeroPieza: numeroPieza,
          contrasenaTramite: contrasenaINM,
          datosFormulario: {
            ...tramite?.datosFormulario,
            numeroPiezaINM: numeroPieza,
            contrasenaINM: contrasenaINM,
            etapaGestion: 'requisitos',
            origenApp: tramite?.numeroPieza?.startsWith('MSX-') || tramite?.datosFormulario?.origenApp || false,
          },
        });

        if (pdfFile) {
          const formData = new FormData();
          formData.append('file', pdfFile);
          formData.append('nombre', 'Solicitud generada por el INM');
          formData.append('categoria', 'solicitud');
          formData.append('tramiteId', tramiteId);
          await api.post('/documentos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {});
        }

        toast.success('Pieza y solicitud guardadas correctamente');
      } catch {
        toast.error('Error al guardar la pieza. Intenta de nuevo.');
        return;
      }
    }

    if (step === 1) {
      if (requisitosSeleccionados.size === 0) { toast.error('Selecciona al menos un requisito'); return; }
      await saveEtapa('pago');
    }

    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await api.patch(`/tramites/${tramiteId}/continuar`, {
        datosFormulario: { ...tramite?.datosFormulario, etapaGestion: 'finalizado' },
      });

      await api.patch(`/tramites/${tramiteId}/estatus`, {
        estatus: 'en_revision',
        observaciones: `Solicitud INM completada. Pieza: ${numeroPieza}`,
      });

      if (pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        formData.append('nombre', 'Solicitud generada por el INM');
        formData.append('categoria', 'solicitud');
        formData.append('tramiteId', tramiteId);
        await api.post('/documentos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {});
      }

      if (tramite?.cliente?.email || tramite?.datosFormulario?.email) {
        const emailExtranjero = tramite?.cliente?.email || tramite?.datosFormulario?.email;
        const nombreExtranjero = tramite?.cliente?.nombreCompleto || `${tramite?.datosFormulario?.nombre || ''} ${tramite?.datosFormulario?.apellidos || ''}`.trim();
        const requisitosAEnviar = requisitos
          .filter((_, i) => requisitosSeleccionados.has(i))
          .map(r => r.nombre);
        if (requisitosAEnviar.length > 0) {
          await api.post('/notificaciones/enviar-requisitos', {
            email: emailExtranjero,
            nombreExtranjero,
            requisitos: requisitosAEnviar,
          }).catch(() => {});
        }
      }

      if (pagoData.monto && pagoData.concepto) {
        const nombreExtranjero = tramite?.cliente?.nombreCompleto || `${tramite?.datosFormulario?.nombre || ''} ${tramite?.datosFormulario?.apellidos || ''}`.trim();
        const emailExtranjero = pagoData.email || tramite?.cliente?.email || tramite?.datosFormulario?.solicitanteEmail || tramite?.datosFormulario?.email || '';

        if (!emailExtranjero) {
          toast.error('Email del extranjero es obligatorio para generar el link de pago');
          setSubmitting(false);
          return;
        }

        try {
          await api.post('/financiero/pagos/generar-dividido', {
            tramiteId,
            clienteId: tramite?.clienteId,
            montoTotal: parseFloat(pagoData.monto),
            concepto: pagoData.concepto,
            clienteNombre: nombreExtranjero,
            email: emailExtranjero,
            numeroPagos: parseInt(pagoData.numeroPagos || '2'),
          });
          toast.success(`${pagoData.numeroPagos || '2'} pago(s) generados y link enviado al extranjero`);
        } catch (err: any) {
          toast.error(err?.response?.data?.message || 'Error al generar pagos. Verifica el email.');
        }
      }

      toast.success('Trámite completado. Requisitos enviados al extranjero.');
      router.push(`/tramites/${tramiteId}`);
    } catch {
      toast.error('Error al completar el trámite');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="h-8 w-8 text-amber-500 animate-spin" /></div>;
  }

  const URL_POR_TIPO: Record<string, string> = {
    visa: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html',
    permiso_trabajo: 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html',
    notificacion_cambio: 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html',
    expedicion_documento: 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html',
    regularizacion_migratoria: 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html',
    constancia_empleador: 'https://www.inm.gob.mx/tramites/publico/solicitud_empresa.html',
    cambio_condicion_estancia: 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html',
  };
  const urlSolicitud = URL_POR_TIPO[tramite?.tipo] || 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html';

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex-shrink-0 border-b border-[#262626] bg-[#0a0a0a] px-4 py-3 flex items-center gap-4">
        <Link href={`/tramites/${tramiteId}`} className="p-2 rounded-lg hover:bg-[#222222] text-white/70">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white truncate">Continuar Trámite</h1>
          <p className="text-xs text-white/50 truncate">{tramite?.cliente?.nombreCompleto || tramite?.datosFormulario?.nombre || '—'}</p>
        </div>
        {/* Compact Stepper */}
        <div className="flex items-center gap-3">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-amber-500 text-white' : 'bg-[#262626] text-white/70'}`}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${i === step ? 'font-medium text-white' : 'text-white/50'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-[#262626] mx-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Body: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Fixed Sidebar - Ficha del Extranjero (ALWAYS visible) */}
        <div className="w-[320px] flex-shrink-0 border-r border-[#262626] overflow-y-auto bg-[#111111] p-4">
          <h4 className="text-xs font-semibold text-white/70 uppercase mb-3">Ficha del Extranjero</h4>
          {tramite?.datosFormulario && (
            <div className="space-y-4">
              {/* Propósito */}
              {tramite.datosFormulario.propositoViaje && (
                <div>
                  <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Propósito de viaje</p>
                  <CopyField label="" value={tramite.datosFormulario.propositoViaje} />
                  {tramite.datosFormulario.especificaTramite && <CopyField label="Especifica" value={tramite.datosFormulario.especificaTramite} />}
                </div>
              )}
              {/* Datos personales */}
              <div>
                <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Datos del extranjero</p>
                {tramite.datosFormulario.curpExtranjero && <CopyField label="CURP" value={tramite.datosFormulario.curpExtranjero} />}
                <CopyField label="Nombre(s)" value={tramite.datosFormulario.nombre} />
                <CopyField label="Apellido(s)" value={tramite.datosFormulario.apellidos} />
                <CopyField label="Sexo" value={tramite.datosFormulario.sexo === 'H' ? 'Hombre' : tramite.datosFormulario.sexo === 'M' ? 'Mujer' : ''} />
                <CopyField label="Fecha nacimiento" value={tramite.datosFormulario.fechaNacimiento} isDate />
                <CopyField label="Nacionalidad" value={tramite.datosFormulario.nacionalidad} />
                <CopyField label="Estado civil" value={tramite.datosFormulario.estadoCivil} />
              </div>

              {/* Lugar de nacimiento */}
              <div>
                <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Lugar de nacimiento</p>
                <CopyField label="País" value={tramite.datosFormulario.paisNacimiento} />
                <CopyField label="Estado/Provincia" value={tramite.datosFormulario.estadoProvinciaNacimiento} />
              </div>
              {/* Documento */}
              <div>
                <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Documento de identidad</p>
                <CopyField label="Tipo" value={tramite.datosFormulario.documentoIdentificacion} />
                <CopyField label="Número" value={tramite.datosFormulario.numeroDocumento} />
                <CopyField label="País expedición" value={tramite.datosFormulario.paisExpedicion} />
                <CopyField label="Expedición" value={tramite.datosFormulario.fechaExpedicion} isDate />
                <CopyField label="Vencimiento" value={tramite.datosFormulario.fechaVencimiento} isDate />
              </div>
              {/* Domicilio en México */}
              <div>
                <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Domicilio en México</p>
                <CopyField label="CP" value={tramite.datosFormulario.domCodigoPostal} />
                <CopyField label="Estado" value={tramite.datosFormulario.domEstado} />
                <CopyField label="Municipio" value={tramite.datosFormulario.domMunicipio} />
                <CopyField label="Colonia" value={tramite.datosFormulario.domColonia} />
                <CopyField label="Calle" value={tramite.datosFormulario.domCalle} />
                <CopyField label="Núm. exterior" value={tramite.datosFormulario.domNumeroExterior} />
                <CopyField label="Núm. interior" value={tramite.datosFormulario.domNumeroInterior} />
                <CopyField label="Lada" value={tramite.datosFormulario.domLada} />
                <CopyField label="Teléfono" value={tramite.datosFormulario.domTelefonoFijo} />
                {!tramite.datosFormulario.domEstado && <p className="text-[10px] text-white/70 italic">No capturado por el extranjero</p>}
              </div>

              {/* Información adicional (visa) */}
              {tramite.datosFormulario.actividadPrincipal && (
                <div>
                  <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Información adicional</p>
                  <CopyField label="Actividad principal" value={tramite.datosFormulario.actividadPrincipal} />
                  <CopyField label="Sector trabajo" value={tramite.datosFormulario.sectorTrabajo} />
                  <CopyField label="Situación trabajo" value={tramite.datosFormulario.situacionTrabajo} />
                  <CopyField label="Ocupación" value={tramite.datosFormulario.ocupacionTrabajo} />
                  <CopyField label="¿Expulsado?" value={tramite.datosFormulario.expulsadoMexico} />
                  <CopyField label="¿Antecedentes?" value={tramite.datosFormulario.antecedentesPenales} />
                </div>
              )}
              {/* Visas del extranjero (solo para trámites de visa) */}
              {tramite.tipo === 'visa' && (
                <div>
                  <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Visas del extranjero</p>
                  {tramite.datosFormulario.visas && tramite.datosFormulario.visas.length > 0 ? (
                    <div className="space-y-2">
                      {tramite.datosFormulario.visas.map((visa: any, i: number) => (
                        <div key={i} className="p-2 rounded-lg border border-[#3a3a3a] bg-[#1a1a1a]">
                          <CopyField label={`Visa ${i + 1} - País`} value={visa.pais} />
                          <CopyField label="Número" value={visa.numero} />
                          {visa.fechaVencimiento && <CopyField label="Vencimiento" value={visa.fechaVencimiento} isDate />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-white/70 italic">No capturado por el extranjero</p>
                  )}
                </div>
              )}

              {/* Empleador */}
              {tramite.datosFormulario.empleadorTipoPersona && (
                <div>
                  <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Empleador</p>
                  <CopyField label="Tipo persona" value={tramite.datosFormulario.empleadorTipoPersona} />
                  <CopyField label="RFC" value={tramite.datosFormulario.empleadorRfc} />
                  <CopyField label="Expediente" value={tramite.datosFormulario.empleadorNumeroExpediente} />
                </div>
              )}
              {/* Solicitante (visa) */}
              {tramite.datosFormulario.solicitante && tramite.datosFormulario.solicitante.tipoPersona && (
                <div>
                  <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Solicitante de visa</p>
                  <CopyField label="Tipo persona" value={tramite.datosFormulario.solicitante.tipoPersona} />
                  <CopyField label="CURP" value={tramite.datosFormulario.solicitante.curp} />
                  <CopyField label="RFC" value={tramite.datosFormulario.solicitante.rfc || tramite.datosFormulario.solicitante.moralRfc} />
                  <CopyField label="Nombre" value={tramite.datosFormulario.solicitante.nombre || tramite.datosFormulario.solicitante.moralRazonSocial} />
                  <CopyField label="Apellidos" value={tramite.datosFormulario.solicitante.apellidos} />
                  <CopyField label="Nacionalidad" value={tramite.datosFormulario.solicitante.nacionalidad} />
                  <CopyField label="Documento" value={tramite.datosFormulario.solicitante.tipoDocumento} />
                  <CopyField label="Núm. documento" value={tramite.datosFormulario.solicitante.numeroDocumento} />
                  <CopyField label="Vínculo" value={tramite.datosFormulario.solicitante.vinculoParentesco} />
                  <CopyField label="CP" value={tramite.datosFormulario.solicitante.codigoPostal || tramite.datosFormulario.solicitante.moralCodigoPostal} />
                  <CopyField label="Estado" value={tramite.datosFormulario.solicitante.estado || tramite.datosFormulario.solicitante.moralEstado} />
                  <CopyField label="Municipio" value={tramite.datosFormulario.solicitante.municipio || tramite.datosFormulario.solicitante.moralMunicipio} />
                  <CopyField label="Colonia" value={tramite.datosFormulario.solicitante.colonia || tramite.datosFormulario.solicitante.moralColonia} />
                  <CopyField label="Calle" value={tramite.datosFormulario.solicitante.calle || tramite.datosFormulario.solicitante.moralCalle} />
                  <CopyField label="Núm. ext" value={tramite.datosFormulario.solicitante.numeroExterior || tramite.datosFormulario.solicitante.moralNumeroExterior} />
                </div>
              )}

              {/* Contacto */}
              <div>
                <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-amber-500/30 pb-1 mb-2">Contacto</p>
                <CopyField label="Email" value={tramite.datosFormulario.solicitanteEmail || tramite.datosFormulario.email} />
                <CopyField label="Teléfono" value={tramite.datosFormulario.telefono} />
              </div>

              {/* Datos del Gestor asignado */}
              <GestorDataSection tramite={tramite} />
            </div>
          )}
        </div>

        {/* RIGHT: Content area that changes per step */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Step 0: Solicitud INM - Completed (pieza real del INM) */}
          {step === 0 && tramite?.numeroPieza && !tramite.numeroPieza.startsWith('MSX-') && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="max-w-md w-full text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Check className="h-6 w-6 text-green-500" />
                  <h2 className="text-xl font-semibold text-white">Solicitud INM Completada</h2>
                </div>
                <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-emerald-400 font-medium">La solicitud ya fue generada en el INM.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-white/70 mb-1">Número de Pieza</p>
                    <p className="text-lg font-mono font-bold text-amber-400">{tramite.numeroPieza}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/70 mb-1">Clave INM</p>
                    <p className="text-lg font-mono font-bold text-amber-400">{tramite.contrasenaTramite || contrasenaINM || '—'}</p>
                  </div>
                </div>
                <button type="button" onClick={handleNext} className="mt-8 flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 mx-auto">
                  Siguiente <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 0: Solicitud INM - Pendiente (iframe) */}
          {step === 0 && (!tramite?.numeroPieza || tramite.numeroPieza.startsWith('MSX-')) && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Info banner */}
              <div className="flex-shrink-0 px-4 pt-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <p className="text-xs text-blue-300">Usa la ficha de la izquierda para llenar el formulario del INM. Haz clic en cualquier dato para copiarlo.</p>
                  <a href={urlSolicitud} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 font-medium whitespace-nowrap">
                    <ExternalLink className="h-3.5 w-3.5" /> Nueva pestaña
                  </a>
                </div>
              </div>

              {/* Iframe fullheight */}
              <div className="flex-1 p-4 pb-0 overflow-hidden">
                <div className="w-full h-full border border-[#262626] rounded-lg overflow-hidden">
                  <iframe src={urlSolicitud} className="w-full h-full" title="Formulario INM" />
                </div>
              </div>

              {/* Bottom bar with pieza/clave/PDF + Next */}
              <div className="flex-shrink-0 border-t border-[#262626] bg-[#111111] px-4 py-3">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 mb-3">
                  <p className="text-xs text-amber-300"><strong>Al finalizar:</strong> Copia aquí el número de pieza y la clave que te dio el INM. Luego sube el PDF.</p>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-white/70 mb-1">Número de Pieza *</label>
                    <input type="text" value={numeroPieza} onChange={e => setNumeroPieza(e.target.value)} className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" placeholder="0000011969016" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-white/70 mb-1">Clave *</label>
                    <input type="text" value={contrasenaINM} onChange={e => setContrasenaINM(e.target.value.toUpperCase())} className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" placeholder="QFCSA" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-white/70 mb-1">PDF Solicitud *</label>
                    <label className="flex items-center gap-2 px-3 py-2 border border-[#3a3a3a] bg-[#252525] rounded-lg text-sm text-white/70 hover:bg-[#2a2a2a] cursor-pointer">
                      <Upload className="h-4 w-4" /><span className="truncate">{pdfFile ? pdfFile.name : 'Seleccionar PDF...'}</span>
                      <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="hidden" />
                    </label>
                  </div>
                  <button type="button" onClick={handleNext} className="flex items-center gap-2 px-5 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 flex-shrink-0">
                    Siguiente <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Requisitos */}
          {step === 1 && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-amber-500" />
                    <h2 className="text-lg font-semibold text-white">Requisitos Documentales</h2>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setRequisitosSeleccionados(new Set(requisitos.map((_, i) => i)))} className="text-xs text-amber-400 hover:text-amber-300 px-3 py-1 border border-amber-500/30 rounded-lg">Seleccionar todos</button>
                    <button type="button" onClick={() => setRequisitosSeleccionados(new Set())} className="text-xs text-white/70 hover:text-white px-3 py-1 border border-[#3a3a3a] rounded-lg">Limpiar</button>
                  </div>
                </div>
                <p className="text-sm text-white/70 mb-4">Selecciona los requisitos que aplican para este extranjero. Solo se enviarán los que marques.</p>
                <div className="space-y-2">
                  {requisitos.map((req, i) => {
                    const selected = requisitosSeleccionados.has(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const next = new Set(requisitosSeleccionados);
                          if (next.has(i)) next.delete(i); else next.add(i);
                          setRequisitosSeleccionados(next);
                        }}
                        className={`w-full text-left p-4 rounded-lg border transition-all duration-200 flex items-start gap-3 ${selected ? 'border-amber-500/50 bg-amber-500/[0.08]' : 'border-[#3a3a3a] bg-[#1a1a1a] hover:border-[#4a4a4a]'}`}
                      >
                        <div className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${selected ? 'bg-amber-500 border-amber-500' : 'border-[#3a3a3a]'}`}>
                          {selected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">
                            {req.nombre}
                            {req.obligatorio
                              ? <span className="ml-2 text-xs text-amber-500">(Obligatorio)</span>
                              : <span className="ml-2 text-xs text-white/70">(Si aplica)</span>}
                          </p>
                          <p className="text-xs text-white/70 mt-0.5">{req.descripcion}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Resumen de selección */}
                <div className="mt-4 p-3 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg flex items-center justify-between">
                  <span className="text-sm text-white/70">{requisitosSeleccionados.size} de {requisitos.length} requisitos seleccionados</span>
                  {requisitosSeleccionados.size === 0 && <span className="text-xs text-amber-400">⚠️ Selecciona al menos uno</span>}
                </div>

                {/* Info de envío */}
                <div className="mt-4 p-4 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-300 font-medium">📧 Al dar clic en Siguiente o Finalizar y enviar requisitos:</p>
                  <p className="text-sm text-white/80 mt-1">Se enviará un correo al extranjero ({tramite?.datosFormulario?.solicitanteEmail || tramite?.cliente?.email || 'sin email'}) con los {requisitosSeleccionados.size} requisitos seleccionados.</p>
                </div>
              </div>

              {/* Bottom navigation */}
              <div className="flex-shrink-0 border-t border-[#262626] bg-[#111111] px-6 py-3 flex items-center justify-between">
                <button type="button" onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-4 py-2.5 border border-[#3a3a3a] text-white/70 rounded-lg text-sm font-medium hover:bg-[#1a1a1a]">
                  <ArrowLeft className="h-4 w-4" /> Anterior
                </button>
                <button type="button" onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">
                  Siguiente <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Pago */}
          {step === 2 && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-semibold text-white">Registrar Costo del Trámite</h2>
                </div>
                <p className="text-sm text-white/70 mb-4">Define el monto total y en cuántos pagos se dividirá. Se genera link de Mercado Pago para el primer pago automáticamente.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Concepto *</label>
                    <input type="text" value={pagoData.concepto} onChange={e => setPagoData(prev => ({ ...prev, concepto: e.target.value }))} className="w-full px-3 py-2.5 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" placeholder="Ej: Pago de derechos por visa" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Monto TOTAL (MXN) *</label>
                    <input type="number" value={pagoData.monto} onChange={e => setPagoData(prev => ({ ...prev, monto: e.target.value }))} className="w-full px-3 py-2.5 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Número de pagos</label>
                    <select value={pagoData.numeroPagos || '2'} onChange={e => setPagoData(prev => ({ ...prev, numeroPagos: e.target.value }))} className="w-full px-3 py-2.5 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400">
                      <option value="1">1 pago (completo)</option>
                      <option value="2">2 pagos (50% + 50%)</option>
                      <option value="3">3 pagos (33% cada uno)</option>
                      <option value="4">4 pagos (25% cada uno)</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-white/70 mb-1">Email del extranjero (para link de pago) *</label>
                    <input type="email" value={pagoData.email} onChange={e => setPagoData(prev => ({ ...prev, email: e.target.value }))} className="w-full px-3 py-2.5 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" placeholder="correo@ejemplo.com" />
                    <p className="text-[10px] text-white/40 mt-1">Se genera link de Mercado Pago para el primer pago. Los siguientes se envían conforme avanza el trámite.</p>
                  </div>
                </div>

                {pagoData.monto && (
                  <div className="mt-4 p-4 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg max-w-3xl">
                    <p className="text-sm text-amber-300 font-medium">Desglose de pagos ({pagoData.numeroPagos || '2'} parcialidades):</p>
                    {Array.from({ length: parseInt(pagoData.numeroPagos || '2') }).map((_, i) => {
                      const numP = parseInt(pagoData.numeroPagos || '2');
                      const montoP = Math.round((parseFloat(pagoData.monto) / numP) * 100) / 100;
                      const esUltimo = i === numP - 1;
                      const montoReal = esUltimo ? Math.round((parseFloat(pagoData.monto) - montoP * (numP - 1)) * 100) / 100 : montoP;
                      return (
                        <p key={i} className="text-sm text-white/80 mt-1">
                          • Pago {i + 1}: <strong className="text-amber-400">${montoReal.toLocaleString()} MXN</strong>
                          {i === 0 ? ' — se cobra ahora' : ' — se cobra al avanzar el trámite'}
                        </p>
                      );
                    })}
                    <p className="text-xs text-white/70 mt-2">El extranjero tiene 15 días para pagar cada parcialidad. También puede pagar por transferencia.</p>
                  </div>
                )}
              </div>

              {/* Bottom navigation */}
              <div className="flex-shrink-0 border-t border-[#262626] bg-[#111111] px-6 py-3 flex items-center justify-between">
                <button type="button" onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-4 py-2.5 border border-[#3a3a3a] text-white/70 rounded-lg text-sm font-medium hover:bg-[#1a1a1a]">
                  <ArrowLeft className="h-4 w-4" /> Anterior
                </button>
                <button type="button" onClick={handleFinish} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  <Check className="h-4 w-4" /> {submitting ? 'Finalizando...' : 'Finalizar y enviar requisitos'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GestorDataSection({ tramite }: { tramite: any }) {
  const [gestores, setGestores] = useState<any[]>([]);
  const [selectedGestorId, setSelectedGestorId] = useState(tramite?.asesorId || '');
  const [gestorData, setGestorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/users/asesores');
        const asesores = Array.isArray(res.data) ? res.data : res.data?.data || [];
        
        try {
          const meRes = await api.get('/auth/me');
          const me = meRes.data;
          if (me && me.role === 'administrador' && !asesores.find((a: any) => a.id === me.id)) {
            asesores.unshift(me);
          }
        } catch {}

        setGestores(asesores);
        if (tramite?.asesorId) {
          setSelectedGestorId(tramite.asesorId);
          loadGestorData(tramite.asesorId);
        } else if (asesores.length > 0) {
          setSelectedGestorId(asesores[0].id);
          loadGestorData(asesores[0].id);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [tramite?.asesorId]);

  const loadGestorData = async (id: string) => {
    try {
      const res = await api.get(`/users/${id}`);
      setGestorData(res.data);
    } catch { setGestorData(null); }
  };

  const handleChange = (id: string) => {
    setSelectedGestorId(id);
    loadGestorData(id);
  };

  if (loading) return null;

  return (
    <div>
      <p className="text-[10px] font-semibold text-emerald-400 uppercase border-b border-emerald-500/30 pb-1 mb-2 mt-4">👤 Datos del Gestor</p>
      <div className="mb-2">
        <select
          value={selectedGestorId}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full px-2 py-1.5 text-xs border border-[#3a3a3a] bg-[#222222] text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
        >
          <option value="">Seleccionar gestor</option>
          {gestores.map((g: any) => (
            <option key={g.id} value={g.id}>{g.fullName || g.email} ({g.role})</option>
          ))}
        </select>
      </div>
      {gestorData && (
        <div className="space-y-0.5">
          <CopyField label="Nombre gestor" value={gestorData.fullName} />
          <CopyField label="Email" value={gestorData.email} />
          <CopyField label="Teléfono" value={gestorData.phone} />
          {gestorData.metadata?.curp && <CopyField label="CURP" value={gestorData.metadata.curp} />}
          {gestorData.metadata?.rfc && <CopyField label="RFC" value={gestorData.metadata.rfc} />}
          {gestorData.metadata?.nacionalidad && <CopyField label="Nacionalidad" value={gestorData.metadata.nacionalidad} />}
          {gestorData.metadata?.numeroPasaporte && <CopyField label="Pasaporte" value={gestorData.metadata.numeroPasaporte} />}
          {gestorData.metadata?.direccion && <CopyField label="Dirección" value={gestorData.metadata.direccion} />}
          {gestorData.metadata?.fechaNacimiento && <CopyField label="Fecha nac." value={gestorData.metadata.fechaNacimiento} isDate />}
          {gestorData.metadata?.sexo && <CopyField label="Sexo" value={gestorData.metadata.sexo === 'H' ? 'Hombre' : gestorData.metadata.sexo === 'M' ? 'Mujer' : gestorData.metadata.sexo} />}
        </div>
      )}
    </div>
  );
}
