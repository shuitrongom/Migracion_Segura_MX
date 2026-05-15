'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, FileText, ClipboardList, DollarSign, ExternalLink, Upload, Key, Copy } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { TipoTramite } from '@/lib/types';
import { PROPOSITOS_VIAJE, SEXOS, ESTADOS_CIVILES, DOCUMENTOS_IDENTIFICACION, NACIONALIDADES, PAISES, ACTIVIDADES_PRINCIPALES, SI_NO, TIPOS_PERSONA, DOCUMENTOS_IDENTIFICACION_PERSONA } from '@/lib/catalogos-inm';
import { ESTADOS_MEXICO, MUNICIPIOS_POR_ESTADO, SECTORES_ACTIVIDAD, DOCUMENTOS_PERSONA_FISICA } from '@/lib/catalogos-mexico';
import { DatePicker } from '@/components/ui/date-picker';

const TRAMITES_INM: { tipo: TipoTramite; nombre: string; descripcion: string; urlSolicitud: string }[] = [
  { tipo: TipoTramite.VISA, nombre: 'Visas solicitadas ante el INM', descripcion: 'Solicitud de visa por unidad familiar, razones humanitarias u oferta de empleo', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html' },
  { tipo: TipoTramite.RESIDENCIA_TEMPORAL, nombre: 'Residencia Temporal', descripcion: 'Para extranjeros que desean residir en México de 1 a 4 años', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html' },
  { tipo: TipoTramite.RESIDENCIA_PERMANENTE, nombre: 'Residencia Permanente', descripcion: 'Para extranjeros que desean residir indefinidamente', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html' },
  { tipo: TipoTramite.REGULARIZACION, nombre: 'Regularización Migratoria', descripcion: 'Para extranjeros en situación irregular', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html' },
  { tipo: TipoTramite.CAMBIO_CONDICION, nombre: 'Cambio de Condición de Estancia', descripcion: 'Cambiar de una condición migratoria a otra', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html' },
  { tipo: TipoTramite.NACIONALIDAD, nombre: 'Nacionalidad Mexicana', descripcion: 'Carta de naturalización o declaratoria', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html' },
  { tipo: TipoTramite.PERMISO_TRABAJO, nombre: 'Permiso de Trabajo', descripcion: 'Autorización para actividades remuneradas', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html' },
  { tipo: TipoTramite.RENOVACION, nombre: 'Renovación de Documento', descripcion: 'Renovar tarjeta de residente', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html' },
  { tipo: TipoTramite.CAMBIO_DOMICILIO, nombre: 'Cambio de Domicilio', descripcion: 'Notificar cambio de domicilio', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html' },
  { tipo: TipoTramite.REPOSICION_DOCUMENTO, nombre: 'Reposición de Documento', descripcion: 'Reponer documento por robo o extravío', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html' },
  { tipo: TipoTramite.CAMBIO_NACIONALIDAD, nombre: 'Cambio de Nacionalidad', descripcion: 'Notificar cambio de nacionalidad', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html' },
];

interface Requisito { nombre: string; obligatorio: boolean; descripcion: string; }
interface Costo { concepto: string; monto: number; moneda: string; fundamentoLegal: string; }

const STEPS = ['Trámite', 'Datos del Extranjero', 'Solicitud INM', 'Pieza y Contraseña', 'Requisitos', 'Pago'];

export default function NuevoTramitePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedTramite, setSelectedTramite] = useState<(typeof TRAMITES_INM)[0] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Datos del extranjero (se guardan en nuestra BD)
  const [extranjero, setExtranjero] = useState({
    propositoViaje: '', 
    // Datos conforme a pasaporte
    nombre: '', apellidos: '', sexo: '', fechaNacimiento: '',
    nacionalidad: '', estadoCivil: '',
    // Lugar de nacimiento
    paisNacimiento: '', estadoProvinciaNacimiento: '',
    // Pasaporte
    documentoIdentificacion: '', numeroDocumento: '', paisExpedicion: '',
    fechaExpedicion: '', fechaVencimiento: '',
    // Información adicional
    actividadPrincipal: '', expulsadoMexico: '', antecedentesPenales: '',
    telefono: '', email: '',
    visasActuales: '', comentarios: '',
    // Datos del promovente (correo y teléfono de contacto)
    solicitanteEmail: '', solicitanteEmailConfirmacion: '',
    personaAutorizada: '',
  });

  // Visas del extranjero (array dinámico)
  const [visas, setVisas] = useState<{ pais: string; numero: string; vencimiento: string }[]>([]);
  const [visaTemp, setVisaTemp] = useState({ pais: '', numero: '', vencimiento: '' });

  // Personas autorizadas (array dinámico)
  const [personasAutorizadas, setPersonasAutorizadas] = useState<{ curp: string; nombre: string; apellidos: string; nacionalidad: string; tipoDocumento: string; numeroDocumento: string }[]>([]);
  const [personaTemp, setPersonaTemp] = useState({ curp: '', nombre: '', apellidos: '', nacionalidad: '', tipoDocumento: '', numeroDocumento: '' });

  // Datos del solicitante (persona física o moral)
  const [solicitante, setSolicitante] = useState({
    tipoPersona: '',
    // Persona física
    curp: '', rfc: '', nombre: '', apellidos: '', nacionalidad: '',
    tipoDocumento: '', numeroDocumento: '',
    // Domicilio
    codigoPostal: '', estado: '', municipio: '', colonia: '', calle: '',
    numeroExterior: '', numeroInterior: '', lada: '', telefonoFijo: '',
    // Persona moral
    moralRfc: '', moralRazonSocial: '', moralSector: '', moralGiroComercial: '',
    moralCodigoPostal: '', moralEstado: '', moralMunicipio: '', moralColonia: '',
    moralCalle: '', moralNumeroExterior: '', moralNumeroInterior: '', moralLada: '', moralTelefonoFijo: '',
    moralNumeroActa: '', moralFechaActa: '',
  });
  const updateSolicitante = (field: string, value: string) => {
    // CURP y RFC siempre en mayúsculas
    const upperFields = ['curp', 'rfc', 'moralRfc'];
    const formatted = upperFields.includes(field) ? value.toUpperCase() : value;
    setSolicitante(prev => ({ ...prev, [field]: formatted }));
  };

  // Pieza y contraseña
  const [numeroPieza, setNumeroPieza] = useState('');
  const [contrasenaINM, setContrasenaINM] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Errores de validación por campo
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const hasError = (field: string) => fieldErrors[field] === true;
  const inputClass = (field: string) => `w-full px-3 py-2 border rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-brand-500 ${hasError(field) ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`;
  const inputClassUpper = (field: string) => `w-full px-3 py-2 border rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-500 ${hasError(field) ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`;

  // Validaciones de CURP y RFC
  const validateCurp = (value: string): string | null => {
    if (!value) return null; // No es obligatorio, solo valida si hay valor
    if (value.length !== 18) return 'La CURP debe tener 18 caracteres';
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
    if (!curpRegex.test(value)) return 'Formato de CURP inválido';
    return null;
  };

  const validateRfc = (value: string): string | null => {
    if (!value) return null; // No es obligatorio, solo valida si hay valor
    if (value.length < 12 || value.length > 13) return 'El RFC debe tener 12 o 13 caracteres';
    const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{0,3}$/;
    if (!rfcRegex.test(value)) return 'Formato de RFC inválido';
    return null;
  };
  const ErrorMsg = ({ field }: { field: string }) => hasError(field) ? <p className="text-[11px] text-red-500 mt-1">Este campo es requerido</p> : null;
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({});
  const CustomErrorMsg = ({ field }: { field: string }) => customErrors[field] ? <p className="text-[11px] text-red-500 mt-1">{customErrors[field]}</p> : null;

  // Requisitos y costo
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [costo, setCosto] = useState<Costo | null>(null);

  useEffect(() => {
    if (!selectedTramite) return;
    Promise.all([
      api.get(`/tramites/requisitos/${selectedTramite.tipo}`),
      api.get(`/tramites/costo/${selectedTramite.tipo}`),
    ]).then(([reqRes, costoRes]) => {
      setRequisitos(reqRes.data || []);
      setCosto(costoRes.data || null);
    }).catch(() => toast.error('Error al cargar información del trámite'));
  }, [selectedTramite]);

  const updateExtranjero = (field: string, value: string) => {
    // CURP y RFC siempre en mayúsculas
    const upperFields = ['curp', 'rfc'];
    const formatted = upperFields.includes(field) ? value.toUpperCase() : value;
    setExtranjero(prev => ({ ...prev, [field]: formatted }));
    if (fieldErrors[field]) setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const handleAddVisa = () => {
    if (!visaTemp.pais) { toast.error('Selecciona el país de la visa'); return; }
    setVisas([...visas, { ...visaTemp }]);
    setVisaTemp({ pais: '', numero: '', vencimiento: '' });
  };

  const handleRemoveVisa = (index: number) => {
    setVisas(visas.filter((_, i) => i !== index));
  };

  const handleAddPersona = () => {
    if (!personaTemp.nombre.trim() || !personaTemp.apellidos.trim()) { toast.error('Nombre y apellidos son obligatorios'); return; }
    if (!personaTemp.nacionalidad) { toast.error('Selecciona la nacionalidad'); return; }
    setPersonasAutorizadas([...personasAutorizadas, { ...personaTemp }]);
    setPersonaTemp({ curp: '', nombre: '', apellidos: '', nacionalidad: '', tipoDocumento: '', numeroDocumento: '' });
  };

  const handleRemovePersona = (index: number) => {
    setPersonasAutorizadas(personasAutorizadas.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 0 && !selectedTramite) { toast.error('Selecciona un tipo de trámite'); return; }
    if (step === 1) {
      const errors: Record<string, boolean> = {};
      if (!extranjero.propositoViaje) errors['propositoViaje'] = true;
      if (!extranjero.nombre.trim()) errors['nombre'] = true;
      if (!extranjero.apellidos.trim()) errors['apellidos'] = true;
      if (!extranjero.sexo) errors['sexo'] = true;
      if (!extranjero.fechaNacimiento) errors['fechaNacimiento'] = true;
      if (!extranjero.nacionalidad) errors['nacionalidad'] = true;
      if (!extranjero.paisNacimiento) errors['paisNacimiento'] = true;
      if (!extranjero.estadoProvinciaNacimiento.trim()) errors['estadoProvinciaNacimiento'] = true;
      if (!extranjero.documentoIdentificacion) errors['documentoIdentificacion'] = true;
      if (!extranjero.numeroDocumento.trim()) errors['numeroDocumento'] = true;
      if (!extranjero.paisExpedicion) errors['paisExpedicion'] = true;
      if (!extranjero.actividadPrincipal) errors['actividadPrincipal'] = true;
      if (!extranjero.expulsadoMexico) errors['expulsadoMexico'] = true;
      if (!extranjero.antecedentesPenales) errors['antecedentesPenales'] = true;
      if (!solicitante.tipoPersona) errors['tipoPersona'] = true;
      if (solicitante.tipoPersona === 'Física') {
        if (!solicitante.nombre.trim()) errors['sol_nombre'] = true;
        if (!solicitante.apellidos.trim()) errors['sol_apellidos'] = true;
        if (!solicitante.nacionalidad) errors['sol_nacionalidad'] = true;
        if (!solicitante.tipoDocumento) errors['sol_tipoDocumento'] = true;
        if (!solicitante.numeroDocumento.trim()) errors['sol_numeroDocumento'] = true;
        if (!solicitante.codigoPostal.trim()) errors['sol_codigoPostal'] = true;
        if (!solicitante.estado) errors['sol_estado'] = true;
        if (!solicitante.municipio) errors['sol_municipio'] = true;
        if (!solicitante.colonia.trim()) errors['sol_colonia'] = true;
        if (!solicitante.calle.trim()) errors['sol_calle'] = true;
        if (!solicitante.numeroExterior.trim()) errors['sol_numeroExterior'] = true;
      }
      if (solicitante.tipoPersona === 'Moral') {
        if (!solicitante.moralRfc.trim()) errors['moral_rfc'] = true;
        if (!solicitante.moralRazonSocial.trim()) errors['moral_razonSocial'] = true;
        if (!solicitante.moralCodigoPostal.trim()) errors['moral_codigoPostal'] = true;
        if (!solicitante.moralEstado) errors['moral_estado'] = true;
        if (!solicitante.moralMunicipio) errors['moral_municipio'] = true;
        if (!solicitante.moralColonia.trim()) errors['moral_colonia'] = true;
        if (!solicitante.moralCalle.trim()) errors['moral_calle'] = true;
        if (!solicitante.moralNumeroExterior.trim()) errors['moral_numeroExterior'] = true;
      }
      if (!extranjero.solicitanteEmail.trim()) errors['solicitanteEmail'] = true;
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(extranjero.solicitanteEmail)) errors['solicitanteEmail'] = true;
      if (!extranjero.solicitanteEmailConfirmacion.trim()) errors['solicitanteEmailConfirmacion'] = true;
      else if (extranjero.solicitanteEmail !== extranjero.solicitanteEmailConfirmacion) errors['solicitanteEmailConfirmacion'] = true;

      setFieldErrors(errors);
      
      // Validar formato de CURP y RFC
      const cErrors: Record<string, string> = {};
      if (solicitante.tipoPersona === 'Física') {
        const curpErr = validateCurp(solicitante.curp);
        if (curpErr) cErrors['sol_curp'] = curpErr;
        const rfcErr = validateRfc(solicitante.rfc);
        if (rfcErr) cErrors['sol_rfc'] = rfcErr;
      }
      if (solicitante.tipoPersona === 'Moral') {
        const rfcErr = validateRfc(solicitante.moralRfc);
        if (rfcErr) cErrors['moral_rfc_format'] = rfcErr;
      }
      setCustomErrors(cErrors);

      if (Object.keys(errors).length > 0 || Object.keys(cErrors).length > 0) {
        toast.error('Completa todos los campos obligatorios marcados con *');
        return;
      }
    }
    if (step === 3) {
      if (!numeroPieza.trim()) { toast.error('Ingresa el número de pieza'); return; }
      if (!contrasenaINM.trim()) { toast.error('Ingresa la contraseña del INM'); return; }
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!selectedTramite) return;
    setSubmitting(true);
    try {
      const clienteRes = await api.post('/clientes', {
        nombreCompleto: `${extranjero.nombre} ${extranjero.apellidos}`.trim(),
        email: extranjero.solicitanteEmail || extranjero.email || 'sin-email@pendiente.com',
        telefono: extranjero.telefono || 'pendiente',
      });
      const clienteId = clienteRes.data.id;

      const tramiteRes = await api.post('/tramites', {
        tipo: selectedTramite.tipo,
        clienteId,
        datosFormulario: { ...extranjero, visas, personasAutorizadas, solicitante, numeroPiezaINM: numeroPieza, contrasenaINM },
        esBorrador: false,
      });
      const tramiteId = tramiteRes.data.id;

      if (pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        formData.append('nombre', `Solicitud INM - ${selectedTramite.nombre}`);
        formData.append('categoria', 'solicitud');
        formData.append('tramiteId', tramiteId);
        await api.post('/documentos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {});
      }

      toast.success('Trámite iniciado exitosamente');
      router.push(`/tramites/${tramiteId}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al crear trámite');
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/tramites" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Iniciar Trámite Migratorio</h1>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between overflow-x-auto">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1 flex-shrink-0">
              <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className={`text-xs hidden lg:inline ${i === step ? 'font-medium text-gray-900' : 'text-gray-500'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className="hidden lg:block w-4 h-px bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        {/* Step 0: Seleccionar trámite */}
        {step === 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Selecciona el trámite</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {TRAMITES_INM.map(t => (
                <button key={t.tipo} type="button" onClick={() => setSelectedTramite(t)} className={`text-left p-4 rounded-lg border-2 transition-all ${selectedTramite?.tipo === t.tipo ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className={`text-sm font-medium ${selectedTramite?.tipo === t.tipo ? 'text-brand-700' : 'text-gray-900'}`}>{t.nombre}</p>
                  <p className="text-xs text-gray-500 mt-1">{t.descripcion}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Datos del extranjero - idéntico al formulario INM */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">Propósito del viaje</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Propósito de viaje *</label><select value={extranjero.propositoViaje} onChange={e => updateExtranjero('propositoViaje', e.target.value)} className={inputClass('propositoViaje')}><option value="">Selecciona</option>{PROPOSITOS_VIAJE.map(p => <option key={p} value={p}>{p}</option>)}</select><ErrorMsg field="propositoViaje" /></div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">Datos del extranjero (conforme a pasaporte o documento de identidad)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Nombre(s) *</label><input type="text" value={extranjero.nombre} onChange={e => updateExtranjero('nombre', e.target.value)} className={inputClass('nombre')} /><ErrorMsg field="nombre" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Apellido(s) *</label><input type="text" value={extranjero.apellidos} onChange={e => updateExtranjero('apellidos', e.target.value)} className={inputClass('apellidos')} /><ErrorMsg field="apellidos" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Sexo *</label><select value={extranjero.sexo} onChange={e => updateExtranjero('sexo', e.target.value)} className={inputClass('sexo')}><option value="">Selecciona</option>{SEXOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select><ErrorMsg field="sexo" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Fecha de nacimiento *</label><DatePicker value={extranjero.fechaNacimiento} onChange={v => updateExtranjero('fechaNacimiento', v)} yearRange={[1940, 2010]} /><ErrorMsg field="fechaNacimiento" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Nacionalidad actual *</label><select value={extranjero.nacionalidad} onChange={e => updateExtranjero('nacionalidad', e.target.value)} className={inputClass('nacionalidad')}><option value="">Selecciona</option>{NACIONALIDADES.map(n => <option key={n} value={n}>{n}</option>)}</select><ErrorMsg field="nacionalidad" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Estado civil actual</label><select value={extranjero.estadoCivil} onChange={e => updateExtranjero('estadoCivil', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{ESTADOS_CIVILES.map(ec => <option key={ec.value} value={ec.value}>{ec.label}</option>)}</select></div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">Lugar de nacimiento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">País de nacimiento *</label><select value={extranjero.paisNacimiento} onChange={e => updateExtranjero('paisNacimiento', e.target.value)} className={inputClass('paisNacimiento')}><option value="">Selecciona</option>{PAISES.map(p => <option key={p} value={p}>{p}</option>)}</select><ErrorMsg field="paisNacimiento" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Estado, provincia o departamento *</label><input type="text" value={extranjero.estadoProvinciaNacimiento} onChange={e => updateExtranjero('estadoProvinciaNacimiento', e.target.value)} className={inputClass('estadoProvinciaNacimiento')} /><ErrorMsg field="estadoProvinciaNacimiento" /></div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">Pasaporte o documento con el que se identifica el extranjero</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Documento de identificación *</label><select value={extranjero.documentoIdentificacion} onChange={e => updateExtranjero('documentoIdentificacion', e.target.value)} className={inputClass('documentoIdentificacion')}><option value="">Selecciona</option>{DOCUMENTOS_IDENTIFICACION.map(d => <option key={d} value={d}>{d}</option>)}</select><ErrorMsg field="documentoIdentificacion" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Número de documento *</label><input type="text" value={extranjero.numeroDocumento} onChange={e => updateExtranjero('numeroDocumento', e.target.value)} className={inputClass('numeroDocumento')} /><ErrorMsg field="numeroDocumento" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">País de expedición *</label><select value={extranjero.paisExpedicion} onChange={e => updateExtranjero('paisExpedicion', e.target.value)} className={inputClass('paisExpedicion')}><option value="">Selecciona</option>{PAISES.map(p => <option key={p} value={p}>{p}</option>)}</select><ErrorMsg field="paisExpedicion" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Fecha de expedición</label><DatePicker value={extranjero.fechaExpedicion} onChange={v => updateExtranjero('fechaExpedicion', v)} yearRange={[2000, 2026]} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Fecha de vencimiento</label><DatePicker value={extranjero.fechaVencimiento} onChange={v => updateExtranjero('fechaVencimiento', v)} yearRange={[2024, 2040]} /></div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">Información adicional del extranjero</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Actividad principal en tu país de residencia *</label><select value={extranjero.actividadPrincipal} onChange={e => updateExtranjero('actividadPrincipal', e.target.value)} className={inputClass('actividadPrincipal')}><option value="">Selecciona</option>{ACTIVIDADES_PRINCIPALES.map(a => <option key={a} value={a}>{a}</option>)}</select><ErrorMsg field="actividadPrincipal" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">¿Has sido expulsado de México? *</label><select value={extranjero.expulsadoMexico} onChange={e => updateExtranjero('expulsadoMexico', e.target.value)} className={inputClass('expulsadoMexico')}><option value="">Selecciona</option>{SI_NO.map(o => <option key={o} value={o}>{o}</option>)}</select><ErrorMsg field="expulsadoMexico" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">¿Tienes antecedentes penales? *</label><select value={extranjero.antecedentesPenales} onChange={e => updateExtranjero('antecedentesPenales', e.target.value)} className={inputClass('antecedentesPenales')}><option value="">Selecciona</option>{SI_NO.map(o => <option key={o} value={o}>{o}</option>)}</select><ErrorMsg field="antecedentesPenales" /></div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">Señala las visas con las que cuenta el extranjero</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800 text-center">Si deseas agregar visas será necesario que lo efectúes con el botón &apos;Agregar visa&apos;, de lo contrario los datos de esta sección no serán guardados.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl items-end">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">País</label><select value={visaTemp.pais} onChange={e => setVisaTemp(prev => ({ ...prev, pais: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{PAISES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Número</label><input type="text" value={visaTemp.numero} onChange={e => setVisaTemp(prev => ({ ...prev, numero: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1"><label className="block text-xs font-medium text-gray-600 mb-1">Fecha de vencimiento</label><DatePicker value={visaTemp.vencimiento} onChange={v => setVisaTemp(prev => ({ ...prev, vencimiento: v }))} yearRange={[2024, 2040]} /></div>
                  <button type="button" onClick={handleAddVisa} className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors whitespace-nowrap">Agregar visa</button>
                </div>
              </div>
              {visas.length > 0 && (
                <div className="mt-4 max-w-4xl">
                  <table className="w-full text-sm border rounded-lg overflow-hidden">
                    <thead><tr className="bg-gray-50 border-b"><th className="text-left px-3 py-2 text-xs font-medium text-gray-500">País</th><th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Número</th><th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Vencimiento</th><th className="px-3 py-2"></th></tr></thead>
                    <tbody>{visas.map((v, i) => (<tr key={i} className="border-b last:border-0"><td className="px-3 py-2">{v.pais}</td><td className="px-3 py-2">{v.numero}</td><td className="px-3 py-2">{v.vencimiento}</td><td className="px-3 py-2 text-right"><button type="button" onClick={() => handleRemoveVisa(i)} className="text-xs text-red-500 hover:text-red-700">Eliminar</button></td></tr>))}</tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">Datos de la institución, organismo o persona que solicita la autorización de la visa</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Tipo de persona *</label><select value={solicitante.tipoPersona} onChange={e => { updateSolicitante('tipoPersona', e.target.value); if (fieldErrors['tipoPersona']) setFieldErrors(prev => { const n = { ...prev }; delete n['tipoPersona']; return n; }); }} className={inputClass('tipoPersona')}><option value="">Selecciona</option>{TIPOS_PERSONA.map(t => <option key={t} value={t}>{t}</option>)}</select><ErrorMsg field="tipoPersona" /></div>
              </div>

              {solicitante.tipoPersona === 'Física' && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800 border-b pb-1">Datos de la persona física</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">CURP</label><input type="text" value={solicitante.curp} onChange={e => updateSolicitante('curp', e.target.value)} className={inputClassUpper('curp')} maxLength={18} /><CustomErrorMsg field="sol_curp" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">RFC</label><input type="text" value={solicitante.rfc} onChange={e => updateSolicitante('rfc', e.target.value)} className={inputClassUpper('rfc')} maxLength={13} /><CustomErrorMsg field="sol_rfc" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Nombre(s) *</label><input type="text" value={solicitante.nombre} onChange={e => updateSolicitante('nombre', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Apellido(s) *</label><input type="text" value={solicitante.apellidos} onChange={e => updateSolicitante('apellidos', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Nacionalidad actual *</label><select value={solicitante.nacionalidad} onChange={e => updateSolicitante('nacionalidad', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{NACIONALIDADES.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Tipo de documento *</label><select value={solicitante.tipoDocumento} onChange={e => updateSolicitante('tipoDocumento', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{DOCUMENTOS_PERSONA_FISICA.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Número de documento *</label><input type="text" value={solicitante.numeroDocumento} onChange={e => updateSolicitante('numeroDocumento', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                  </div>

                  <h4 className="text-sm font-semibold text-gray-800 border-b pb-1 pt-2">Domicilio de la persona física</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Código postal *</label><input type="text" value={solicitante.codigoPostal} onChange={e => updateSolicitante('codigoPostal', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Estado *</label><select value={solicitante.estado} onChange={e => { updateSolicitante('estado', e.target.value); updateSolicitante('municipio', ''); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{ESTADOS_MEXICO.map(est => <option key={est} value={est}>{est}</option>)}</select></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Municipio o Alcaldía *</label><select value={solicitante.municipio} onChange={e => updateSolicitante('municipio', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{(MUNICIPIOS_POR_ESTADO[solicitante.estado] || []).map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Colonia *</label><input type="text" value={solicitante.colonia} onChange={e => updateSolicitante('colonia', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Calle *</label><input type="text" value={solicitante.calle} onChange={e => updateSolicitante('calle', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Número exterior *</label><input type="text" value={solicitante.numeroExterior} onChange={e => updateSolicitante('numeroExterior', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Número interior</label><input type="text" value={solicitante.numeroInterior} onChange={e => updateSolicitante('numeroInterior', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Lada</label><input type="text" value={solicitante.lada} onChange={e => updateSolicitante('lada', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Teléfono fijo</label><input type="text" value={solicitante.telefonoFijo} onChange={e => updateSolicitante('telefonoFijo', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                  </div>
                </div>
              )}

              {solicitante.tipoPersona === 'Moral' && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800 border-b pb-1">Datos de la persona moral</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">RFC *</label><input type="text" value={solicitante.moralRfc} onChange={e => updateSolicitante('moralRfc', e.target.value)} className={inputClassUpper('moral_rfc')} maxLength={13} /><CustomErrorMsg field="moral_rfc_format" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Nombre o razón social *</label><input type="text" value={solicitante.moralRazonSocial} onChange={e => updateSolicitante('moralRazonSocial', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                    <div className="md:col-span-3"><label className="block text-xs font-medium text-gray-600 mb-1">Sector o rama de actividad</label><select value={solicitante.moralSector} onChange={e => updateSolicitante('moralSector', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{SECTORES_ACTIVIDAD.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div className="md:col-span-3"><label className="block text-xs font-medium text-gray-600 mb-1">Objeto de la empresa o giro comercial</label><textarea value={solicitante.moralGiroComercial} onChange={e => updateSolicitante('moralGiroComercial', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" /></div>
                  </div>

                  <h4 className="text-sm font-semibold text-gray-800 border-b pb-1 pt-2">Domicilio de la persona moral</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Código postal *</label><input type="text" value={solicitante.moralCodigoPostal} onChange={e => updateSolicitante('moralCodigoPostal', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Estado *</label><select value={solicitante.moralEstado} onChange={e => { updateSolicitante('moralEstado', e.target.value); updateSolicitante('moralMunicipio', ''); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{ESTADOS_MEXICO.map(est => <option key={est} value={est}>{est}</option>)}</select></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Municipio o Alcaldía *</label><select value={solicitante.moralMunicipio} onChange={e => updateSolicitante('moralMunicipio', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{(MUNICIPIOS_POR_ESTADO[solicitante.moralEstado] || []).map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Colonia *</label><input type="text" value={solicitante.moralColonia} onChange={e => updateSolicitante('moralColonia', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Calle *</label><input type="text" value={solicitante.moralCalle} onChange={e => updateSolicitante('moralCalle', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Número exterior *</label><input type="text" value={solicitante.moralNumeroExterior} onChange={e => updateSolicitante('moralNumeroExterior', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Número interior</label><input type="text" value={solicitante.moralNumeroInterior} onChange={e => updateSolicitante('moralNumeroInterior', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Lada</label><input type="text" value={solicitante.moralLada} onChange={e => updateSolicitante('moralLada', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Teléfono fijo</label><input type="text" value={solicitante.moralTelefonoFijo} onChange={e => updateSolicitante('moralTelefonoFijo', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                  </div>

                  <h4 className="text-sm font-semibold text-gray-800 border-b pb-1 pt-2">Datos del acta constitutiva</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Número de acta constitutiva</label><input type="text" value={solicitante.moralNumeroActa} onChange={e => updateSolicitante('moralNumeroActa', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Fecha de registro del acta</label><DatePicker value={solicitante.moralFechaActa} onChange={v => updateSolicitante('moralFechaActa', v)} yearRange={[1950, 2026]} /></div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">Correo electrónico para notificar al promovente</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800 text-center">Agrega la dirección de correo electrónico en donde se recibirán las notificaciones asociadas a tu trámite.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Correo electrónico *</label><input type="email" value={extranjero.solicitanteEmail} onChange={e => updateExtranjero('solicitanteEmail', e.target.value)} className={inputClass('solicitanteEmail')} placeholder="nombre@correo.com" /><ErrorMsg field="solicitanteEmail" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Correo electrónico (confirmación) *</label><input type="email" value={extranjero.solicitanteEmailConfirmacion} onChange={e => updateExtranjero('solicitanteEmailConfirmacion', e.target.value)} className={inputClass('solicitanteEmailConfirmacion')} placeholder="nombre@correo.com" /><ErrorMsg field="solicitanteEmailConfirmacion" /></div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">En su caso, persona autorizada para tramitar, oír o recibir notificaciones</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800 text-center">Si deseas agregar personas autorizadas es necesario que lo efectúes con el botón &apos;Agregar persona&apos;, de lo contrario los datos capturados en esta sección no serán guardados.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Clave Única de Registro de Población (CURP)</label><input type="text" value={personaTemp.curp} onChange={e => setPersonaTemp(prev => ({ ...prev, curp: e.target.value.toUpperCase() }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-500" maxLength={18} />{personaTemp.curp && validateCurp(personaTemp.curp) && <p className="text-[11px] text-red-500 mt-1">{validateCurp(personaTemp.curp)}</p>}</div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Nombre(s) *</label><input type="text" value={personaTemp.nombre} onChange={e => setPersonaTemp(prev => ({ ...prev, nombre: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Apellido(s) *</label><input type="text" value={personaTemp.apellidos} onChange={e => setPersonaTemp(prev => ({ ...prev, apellidos: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Nacionalidad actual *</label><select value={personaTemp.nacionalidad} onChange={e => setPersonaTemp(prev => ({ ...prev, nacionalidad: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{NACIONALIDADES.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Tipo de documento de identificación</label><select value={personaTemp.tipoDocumento} onChange={e => setPersonaTemp(prev => ({ ...prev, tipoDocumento: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{DOCUMENTOS_IDENTIFICACION_PERSONA.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Número de documento</label><input type="text" value={personaTemp.numeroDocumento} onChange={e => setPersonaTemp(prev => ({ ...prev, numeroDocumento: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
              </div>
              <div className="flex justify-end mt-4 max-w-4xl">
                <button type="button" onClick={handleAddPersona} className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors">Agregar persona</button>
              </div>
              {personasAutorizadas.length > 0 && (
                <div className="mt-4 max-w-4xl">
                  <table className="w-full text-sm border rounded-lg overflow-hidden">
                    <thead><tr className="bg-gray-50 border-b"><th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Nombre</th><th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Nacionalidad</th><th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Documento</th><th className="px-3 py-2"></th></tr></thead>
                    <tbody>{personasAutorizadas.map((p, i) => (<tr key={i} className="border-b last:border-0"><td className="px-3 py-2">{p.nombre} {p.apellidos}</td><td className="px-3 py-2">{p.nacionalidad}</td><td className="px-3 py-2">{p.tipoDocumento} {p.numeroDocumento}</td><td className="px-3 py-2 text-right"><button type="button" onClick={() => handleRemovePersona(i)} className="text-xs text-red-500 hover:text-red-700">Eliminar</button></td></tr>))}</tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">Comentarios</h3>
              <p className="text-sm text-gray-500 mb-3">Si lo deseas, puedes agregar algún comentario a la solicitud.</p>
              <textarea value={extranjero.comentarios} onChange={e => updateExtranjero('comentarios', e.target.value)} rows={4} className="w-full max-w-4xl px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              <p className="text-xs text-gray-400 mt-2">* Campos obligatorios</p>
            </div>
          </div>
        )}

        {/* Step 2: Solicitud INM — ficha de datos + iframe lado a lado */}
        {step === 2 && selectedTramite && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-brand-500" />
              <h2 className="text-lg font-semibold text-gray-900">Llenar Solicitud en el INM</h2>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">Usa la ficha de la izquierda como referencia para llenar el formulario del INM a la derecha. Haz clic en cualquier dato para copiarlo.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: '620px' }}>
              {/* Ficha de datos (izquierda) */}
              <div className="lg:col-span-1 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Ficha del Extranjero</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Nombre(s)', value: extranjero.nombre },
                    { label: 'Apellido(s)', value: extranjero.apellidos },
                    { label: 'Sexo', value: extranjero.sexo === 'H' ? 'Hombre' : extranjero.sexo === 'M' ? 'Mujer' : '' },
                    { label: 'Fecha nacimiento', value: extranjero.fechaNacimiento },
                    { label: 'Nacionalidad', value: extranjero.nacionalidad },
                    { label: 'Estado civil', value: extranjero.estadoCivil },
                    { label: 'País nacimiento', value: extranjero.paisNacimiento },
                    { label: 'Estado/Provincia', value: extranjero.estadoProvinciaNacimiento },
                    { label: 'Documento', value: extranjero.documentoIdentificacion },
                    { label: 'Nº documento', value: extranjero.numeroDocumento },
                    { label: 'País expedición', value: extranjero.paisExpedicion },
                    { label: 'Expedición', value: extranjero.fechaExpedicion },
                    { label: 'Vencimiento', value: extranjero.fechaVencimiento },
                    { label: 'Teléfono', value: extranjero.telefono },
                    { label: 'Email', value: extranjero.email },
                    { label: 'Propósito viaje', value: extranjero.propositoViaje },
                    { label: 'Actividad principal', value: extranjero.actividadPrincipal },
                    { label: 'Expulsado de México', value: extranjero.expulsadoMexico },
                    { label: 'Antecedentes penales', value: extranjero.antecedentesPenales },
                  ].filter(item => item.value).map(item => (
                    <button key={item.label} type="button" onClick={() => copyToClipboard(item.value)} className="w-full text-left p-2 rounded hover:bg-white border border-transparent hover:border-gray-200 transition-all group">
                      <p className="text-[10px] text-gray-400 uppercase">{item.label}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-900">{item.value}</p>
                        <Copy className="h-3 w-3 text-gray-300 group-hover:text-brand-500" />
                      </div>
                    </button>
                  ))}
                </div>
                {solicitante.tipoPersona && (
                  <>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mt-4 mb-3">Solicitante</h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Tipo persona', value: solicitante.tipoPersona },
                        { label: 'Nombre', value: solicitante.tipoPersona === 'Física' ? `${solicitante.nombre} ${solicitante.apellidos}`.trim() : solicitante.moralRazonSocial },
                        { label: 'RFC', value: solicitante.tipoPersona === 'Física' ? solicitante.rfc : solicitante.moralRfc },
                        { label: 'Email promovente', value: extranjero.solicitanteEmail },
                      ].filter(item => item.value).map(item => (
                        <button key={item.label} type="button" onClick={() => copyToClipboard(item.value)} className="w-full text-left p-2 rounded hover:bg-white border border-transparent hover:border-gray-200 transition-all group">
                          <p className="text-[10px] text-gray-400 uppercase">{item.label}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-900">{item.value}</p>
                            <Copy className="h-3 w-3 text-gray-300 group-hover:text-brand-500" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {/* Iframe del INM (derecha) */}
              <div className="lg:col-span-2 border rounded-lg overflow-hidden">
                <iframe src={selectedTramite.urlSolicitud} className="w-full h-full" title="Formulario INM" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
              <ExternalLink className="h-4 w-4" />
              <a href={selectedTramite.urlSolicitud} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 font-medium">Abrir en nueva pestaña</a>
            </div>
          </div>
        )}

        {/* Step 3: Pieza y contraseña */}
        {step === 3 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-5 w-5 text-brand-500" />
              <h2 className="text-lg font-semibold text-gray-900">Número de Pieza y Contraseña</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">Ingresa los datos que generó el INM al completar la solicitud.</p>
            <div className="max-w-md space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Número de Pieza (NUT) *</label><input type="text" value={numeroPieza} onChange={e => setNumeroPieza(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Ej: INM/2026/..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Contraseña del INM *</label><input type="text" value={contrasenaINM} onChange={e => setContrasenaINM(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Contraseña generada" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PDF de la solicitud (opcional)</label>
                <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer w-fit">
                  <Upload className="h-4 w-4" />{pdfFile ? pdfFile.name : 'Seleccionar archivo'}
                  <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Requisitos */}
        {step === 4 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="h-5 w-5 text-brand-500" />
              <h2 className="text-lg font-semibold text-gray-900">Requisitos Documentales</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Documentos que el cliente deberá presentar.</p>
            <div className="space-y-3 max-w-2xl">
              {requisitos.map((req, i) => (
                <div key={i} className={`p-4 rounded-lg border ${req.obligatorio ? 'border-brand-200 bg-brand-50/50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium ${req.obligatorio ? 'bg-brand-500 text-white' : 'bg-gray-300 text-white'}`}>{i + 1}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{req.nombre}{req.obligatorio ? <span className="ml-2 text-xs text-brand-600">(Obligatorio)</span> : <span className="ml-2 text-xs text-gray-400">(Si aplica)</span>}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{req.descripcion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Pago */}
        {step === 5 && costo && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-brand-500" />
              <h2 className="text-lg font-semibold text-gray-900">Pago de Derechos</h2>
            </div>
            <div className="max-w-md p-6 rounded-lg border border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500 mb-1">Concepto</p>
              <p className="text-base font-medium text-gray-900 mb-4">{costo.concepto}</p>
              <p className="text-sm text-gray-500 mb-1">Monto</p>
              <p className="text-3xl font-bold text-gray-900 mb-4">{costo.monto === 0 ? 'Sin costo' : `$${costo.monto.toLocaleString('es-MX')} ${costo.moneda}`}</p>
              <p className="text-sm text-gray-500 mb-1">Información</p>
              <p className="text-xs text-gray-600">{costo.fundamentoLegal}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button type="button" onClick={handleBack} disabled={step === 0} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ArrowLeft className="h-4 w-4" /> Anterior</button>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">Siguiente <ArrowRight className="h-4 w-4" /></button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"><Check className="h-4 w-4" /> {submitting ? 'Creando...' : 'Iniciar Trámite'}</button>
        )}
      </div>
    </div>
  );
}
