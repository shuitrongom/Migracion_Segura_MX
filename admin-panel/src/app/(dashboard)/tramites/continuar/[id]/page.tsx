'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, FileText, ClipboardList, ExternalLink, Upload, Key, Loader2, Copy } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '@/lib/api';

function formatDateDisplay(value: string): string {
  if (!value) return '';
  // Si es formato YYYY-MM-DD, convertir a DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }
  return value;
}

function CopyField({ label, value, isDate }: { label: string; value?: string; isDate?: boolean }) {
  if (!value) return null;
  const displayValue = isDate ? formatDateDisplay(value) : value;
  const copyValue = isDate ? formatDateDisplay(value) : value;
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
  const [pagoData, setPagoData] = useState({ concepto: '', monto: '', metodoPago: '', referencia: '' });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(`/tramites/${tramiteId}`);
        setTramite(res.data);
        // Cargar requisitos del tipo de trámite
        const reqRes = await api.get(`/tramites/requisitos/${res.data.tipo}`);
        setRequisitos(reqRes.data || []);
        // Si el trámite ya tiene pieza REAL del INM (no la auto-generada MSX-), saltar al paso de requisitos
        if (res.data.numeroPieza && !res.data.numeroPieza.startsWith('MSX-')) {
          setNumeroPieza(res.data.numeroPieza);
          setContrasenaINM(res.data.contrasenaTramite || '');
          setStep(1); // Ir a Requisitos
        }
      } catch {
        toast.error('Error al cargar el trámite');
      } finally {
        setLoading(false);
      }
    }
    if (tramiteId) fetchData();
  }, [tramiteId]);

  const handleNext = async () => {
    if (step === 0) {
      if (!numeroPieza.trim()) { toast.error('Ingresa el número de pieza'); return; }
      if (!contrasenaINM.trim()) { toast.error('Ingresa la clave del INM'); return; }
      if (!pdfFile) { toast.error('Sube el PDF de la solicitud'); return; }

      // Guardar pieza y clave INMEDIATAMENTE al avanzar
      try {
        await api.patch(`/tramites/${tramiteId}/continuar`, {
          numeroPieza: numeroPieza,
          contrasenaTramite: contrasenaINM,
          datosFormulario: {
            ...tramite?.datosFormulario,
            numeroPiezaINM: numeroPieza,
            contrasenaINM: contrasenaINM,
          },
        });

        // Subir PDF
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
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      // Cambiar estatus a en_revision (la pieza ya se guardó en el paso 1)
      await api.patch(`/tramites/${tramiteId}/estatus`, {
        estatus: 'en_revision',
        observaciones: `Solicitud INM completada. Pieza: ${numeroPieza}`,
      });

      // Subir PDF
      if (pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        formData.append('nombre', 'Solicitud generada por el INM');
        formData.append('categoria', 'solicitud');
        formData.append('tramiteId', tramiteId);
        await api.post('/documentos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {});
      }

      // Enviar requisitos por correo al extranjero
      if (tramite?.cliente?.email || tramite?.datosFormulario?.email) {
        const emailExtranjero = tramite?.cliente?.email || tramite?.datosFormulario?.email;
        const nombreExtranjero = tramite?.cliente?.nombreCompleto || `${tramite?.datosFormulario?.nombre || ''} ${tramite?.datosFormulario?.apellidos || ''}`.trim();
        await api.post('/notificaciones/enviar-requisitos', {
          email: emailExtranjero,
          nombreExtranjero,
          requisitos: requisitos.map(r => r.nombre),
        }).catch(() => {});
      }

      // Registrar pago dividido si se llenó el monto
      if (pagoData.monto && pagoData.concepto) {
        const nombreExtranjero = tramite?.cliente?.nombreCompleto || `${tramite?.datosFormulario?.nombre || ''} ${tramite?.datosFormulario?.apellidos || ''}`.trim();
        const emailExtranjero = tramite?.cliente?.email || tramite?.datosFormulario?.solicitanteEmail || tramite?.datosFormulario?.email || '';
        await api.post('/financiero/pagos/generar-dividido', {
          tramiteId,
          clienteId: tramite?.clienteId,
          montoTotal: parseFloat(pagoData.monto),
          concepto: pagoData.concepto,
          clienteNombre: nombreExtranjero,
          email: emailExtranjero,
        }).catch(() => {});
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
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-amber-500 animate-spin" /></div>;
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
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/tramites/${tramiteId}`} className="p-2 rounded-lg hover:bg-[#222222] text-white/70"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Continuar Trámite</h1>
          <p className="text-sm text-white/70">Extranjero: {tramite?.cliente?.nombreCompleto || tramite?.datosFormulario?.nombre || '—'}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="dark-card-static p-4 mb-6">
        <div className="flex items-center justify-center gap-4">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-amber-500 text-white' : 'bg-[#262626] text-white/70'}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm ${i === step ? 'font-medium text-white' : 'text-white/70'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className="w-12 h-px bg-[#262626] mx-2" />}
            </div>
          ))}
        </div>
      </div>

      <div className="dark-card-static p-6">
        {/* Step 0: Solicitud INM */}
        {step === 0 && tramite?.numeroPieza && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Check className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-semibold text-white">Solicitud INM Completada</h2>
            </div>
            <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-lg p-4 mb-4">
              <p className="text-sm text-emerald-400 font-medium">La solicitud ya fue generada en el INM.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
              <div>
                <p className="text-xs text-white/70 mb-1">Número de Pieza</p>
                <p className="text-lg font-mono font-bold text-amber-400">{tramite.numeroPieza}</p>
              </div>
              <div>
                <p className="text-xs text-white/70 mb-1">Clave INM</p>
                <p className="text-lg font-mono font-bold text-amber-400">{tramite.contrasenaTramite || contrasenaINM || '—'}</p>
              </div>
            </div>
          </div>
        )}

        {step === 0 && !tramite?.numeroPieza && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-white">Llenar Solicitud en el INM</h2>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-300">Usa la ficha de la izquierda como referencia para llenar el formulario del INM a la derecha. Haz clic en cualquier dato para copiarlo.</p>
            </div>

            {/* Layout lado a lado: Ficha + Iframe */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: '620px' }}>
              {/* Ficha de datos (izquierda) */}
              <div className="lg:col-span-1 overflow-y-auto border rounded-lg p-4 bg-[#1a1a1a]">
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
                    {/* Domicilio en México - siempre mostrar */}
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
                  </div>
                )}
              </div>

              {/* Iframe INM (derecha) */}
              <div className="lg:col-span-2 border rounded-lg overflow-hidden">
                <iframe src={urlSolicitud} className="w-full h-full" title="Formulario INM" />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 mb-4 text-sm text-white/70">
              <ExternalLink className="h-4 w-4" />
              <a href={urlSolicitud} target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-400 font-medium">Abrir en nueva pestaña</a>
            </div>

            {/* Campos pieza y clave */}
            <div className="border-t pt-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-300"><strong>Al finalizar:</strong> Copia aquí el número de pieza y la clave que te dio el INM. Luego sube el PDF.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Número de Pieza *</label>
                  <input type="text" value={numeroPieza} onChange={e => setNumeroPieza(e.target.value)} className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" placeholder="0000011969016" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Clave *</label>
                  <input type="text" value={contrasenaINM} onChange={e => setContrasenaINM(e.target.value.toUpperCase())} className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" placeholder="QFCSA" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">PDF Solicitud *</label>
                  <label className="flex items-center gap-2 px-3 py-2 border border-[#3a3a3a] bg-[#252525] rounded-lg text-sm text-white/70 hover:bg-[#2a2a2a] cursor-pointer">
                    <Upload className="h-4 w-4" />{pdfFile ? pdfFile.name : 'Seleccionar PDF...'}
                    <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Requisitos */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-white">Requisitos Documentales</h2>
            </div>
            <p className="text-sm text-white/70 mb-4">Al finalizar se enviarán los requisitos por correo al extranjero.</p>
            <div className="space-y-3 max-w-2xl">
              {requisitos.map((req, i) => (
                <div key={i} className={`p-4 rounded-lg border ${req.obligatorio ? 'border-amber-500/30 bg-amber-500/[0.08]' : 'border-[#3a3a3a] bg-[#1a1a1a]'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium ${req.obligatorio ? 'bg-amber-500 text-white' : 'bg-gray-300 text-white'}`}>{i + 1}</div>
                    <div>
                      <p className="text-sm font-medium text-white">{req.nombre}{req.obligatorio ? <span className="ml-2 text-xs text-amber-500">(Obligatorio)</span> : <span className="ml-2 text-xs text-white/70">(Si aplica)</span>}</p>
                      <p className="text-xs text-white/70 mt-0.5">{req.descripcion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Info de envío */}
            <div className="mt-6 p-4 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg max-w-2xl">
              <p className="text-sm text-amber-300 font-medium">📧 Al dar clic en Siguiente o Finalizar y enviar requisitos:</p>
              <p className="text-sm text-white/80 mt-1">Se enviará un correo al extranjero ({tramite?.datosFormulario?.solicitanteEmail || tramite?.cliente?.email || 'sin email'}) con la lista de documentos que debe presentar.</p>
            </div>
          </div>
        )}

        {/* Step 2: Pago */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-white">Registrar Costo del Trámite</h2>
            </div>
            <p className="text-sm text-white/70 mb-4">El monto se dividirá en 2 pagos: 50% anticipo (se cobra ahora) y 50% liquidación (se cobra al resolver el trámite). Se generará un link de Mercado Pago para el extranjero.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Concepto *</label>
                <input type="text" value={pagoData.concepto} onChange={e => setPagoData(prev => ({ ...prev, concepto: e.target.value }))} className="w-full px-3 py-2.5 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" placeholder="Ej: Pago de derechos por visa" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Monto TOTAL (MXN) *</label>
                <input type="number" value={pagoData.monto} onChange={e => setPagoData(prev => ({ ...prev, monto: e.target.value }))} className="w-full px-3 py-2.5 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400" placeholder="0.00" />
              </div>
            </div>
            {pagoData.monto && (
              <div className="mt-4 p-4 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg max-w-2xl">
                <p className="text-sm text-amber-300 font-medium">Desglose de pagos:</p>
                <p className="text-sm text-white/80 mt-1">• Anticipo (50%): <strong className="text-amber-400">${(parseFloat(pagoData.monto) / 2).toLocaleString()} MXN</strong> — se cobra ahora</p>
                <p className="text-sm text-white/80">• Liquidación (50%): <strong className="text-amber-400">${(parseFloat(pagoData.monto) / 2).toLocaleString()} MXN</strong> — se cobra al resolver</p>
                <p className="text-xs text-white/70 mt-2">El extranjero tiene 15 días para pagar cada parte. Si no paga el anticipo, el trámite se cancela.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button type="button" onClick={() => step > 0 ? setStep(s => s - 1) : router.push(`/tramites/${tramiteId}`)} className="flex items-center gap-2 px-4 py-2.5 border border-[#3a3a3a] text-white/70 rounded-lg text-sm font-medium hover:bg-[#1a1a1a]">
          <ArrowLeft className="h-4 w-4" /> {step === 0 ? 'Cancelar' : 'Anterior'}
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">
            Siguiente <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={handleFinish} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            <Check className="h-4 w-4" /> {submitting ? 'Finalizando...' : 'Finalizar y enviar requisitos'}
          </button>
        )}
      </div>
    </div>
  );
}
