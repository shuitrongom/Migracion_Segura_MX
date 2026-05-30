'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, FileText, ClipboardList, DollarSign, ExternalLink, Upload, Key, Copy } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { TipoTramite } from '@/lib/types';
import { PROPOSITOS_VIAJE, SEXOS, ESTADOS_CIVILES, DOCUMENTOS_IDENTIFICACION, NACIONALIDADES, PAISES, ACTIVIDADES_PRINCIPALES, SI_NO, TIPOS_PERSONA, DOCUMENTOS_IDENTIFICACION_PERSONA, SITUACIONES_TRABAJO, OCUPACIONES_TRABAJO, VINCULOS_PARENTESCO } from '@/lib/catalogos-inm';
import { ESTADOS_MEXICO, MUNICIPIOS_POR_ESTADO, SECTORES_ACTIVIDAD, DOCUMENTOS_PERSONA_FISICA } from '@/lib/catalogos-mexico';
import { DatePicker } from '@/components/ui/date-picker';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/lib/types';
import CieForm from '@/components/cie-form';

const TRAMITES_INM: { tipo: TipoTramite; nombre: string; descripcion: string; urlSolicitud: string }[] = [
  { tipo: TipoTramite.VISA, nombre: 'Visas solicitadas ante el INM', descripcion: 'Solicitud de visa por unidad familiar, razones humanitarias u oferta de empleo', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html' },
  { tipo: TipoTramite.PERMISO_TRABAJO, nombre: 'Permisos solicitados al INM', descripcion: 'Permiso para trabajar o permiso de salida y regreso', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html' },
  { tipo: TipoTramite.NOTIFICACION_CAMBIO, nombre: 'Notificación de Cambio (EC, NOM, NAC, DOM, LT)', descripcion: 'Notificar cambio de estado civil, nombre, nacionalidad, domicilio o lugar de trabajo', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html' },
  { tipo: TipoTramite.EXPEDICION_DOCUMENTO, nombre: 'Expedición de Documento Migratorio', descripcion: 'Renovación, canje, reposición o expedición por acuerdo de documento migratorio', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html' },
  { tipo: TipoTramite.REGULARIZACION_MIGRATORIA, nombre: 'Regularización de Situación Migratoria', descripcion: 'Regularización por razones humanitarias, unidad familiar o documento vencido', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html' },
  { tipo: TipoTramite.CONSTANCIA_EMPLEADOR, nombre: 'Constancias de Inscripción de Empleador (CIE)', descripcion: 'Obtención o actualización de constancia para emitir ofertas de empleo a extranjeros', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_empresa.html' },
  { tipo: TipoTramite.CAMBIO_CONDICION_ESTANCIA, nombre: 'Cambios de Condición de Estancia', descripcion: 'Cambiar de una condición migratoria a otra (7 modalidades)', urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_estancia.html' },
];

interface Requisito { nombre: string; obligatorio: boolean; descripcion: string; }
interface Costo { concepto: string; monto: number; moneda: string; fundamentoLegal: string; }

const STEPS_ADMIN = ['Trámite', 'Datos del Extranjero', 'Solicitud INM', 'Requisitos', 'Pago'];
const STEPS_GESTOR = ['Trámite', 'Datos del Extranjero', 'Solicitud INM', 'Requisitos'];

export default function NuevoTramitePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = user?.role === UserRole.ADMINISTRADOR;
  const STEPS = isAdmin ? STEPS_ADMIN : STEPS_GESTOR;
  const [step, setStep] = useState(0);
  const [selectedTramite, setSelectedTramite] = useState<(typeof TRAMITES_INM)[0] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCitaModal, setShowCitaModal] = useState(false);
  const [citaData, setCitaData] = useState({ fecha: '', horaInicio: '', horaFin: '', notas: '' });
  const [pagoData, setPagoData] = useState({ concepto: '', monto: '', referencia: '', metodoPago: '', comprobante: null as File | null });

  // Datos del extranjero (se guardan en nuestra BD)
  const [extranjero, setExtranjero] = useState({
    propositoViaje: '', 
    // Datos conforme a pasaporte
    curpExtranjero: '',
    nombre: '', apellidos: '', sexo: '', fechaNacimiento: '',
    nacionalidad: '', estadoCivil: '',
    // Lugar de nacimiento
    paisNacimiento: '', estadoProvinciaNacimiento: '',
    // Pasaporte
    documentoIdentificacion: '', numeroDocumento: '', paisExpedicion: '',
    fechaExpedicion: '', fechaVencimiento: '',
    // Domicilio del extranjero en México (para permisos)
    domCodigoPostal: '', domEstado: '', domMunicipio: '', domColonia: '', domCalle: '',
    domNumeroExterior: '', domNumeroInterior: '', domLada: '', domTelefonoFijo: '',
    // Información adicional
    actividadPrincipal: '', sectorTrabajo: '', situacionTrabajo: '', ocupacionTrabajo: '',
    expulsadoMexico: '', antecedentesPenales: '',
    telefono: '', email: '',
    visasActuales: '', comentarios: '',
    // Específico por trámite
    especificaTramite: '',
    // Datos del empleador (solo permiso_trabajo + con empleador)
    empleadorTipoPersona: '', empleadorRfc: '', empleadorNumeroExpediente: '',
    // Datos del promovente (correo y teléfono de contacto)
    solicitanteEmail: '', solicitanteEmailConfirmacion: '',
    personaAutorizada: '',
  });

  // Estado para CIE se maneja en el componente CieForm

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
    tipoDocumento: '', numeroDocumento: '', vinculoParentesco: '',
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
    // Limpiar errores custom al escribir
    if (field === 'curp') setCustomErrors(prev => { const n = { ...prev }; delete n['sol_curp']; return n; });
    if (field === 'rfc') setCustomErrors(prev => { const n = { ...prev }; delete n['sol_rfc']; return n; });
    if (field === 'moralRfc') setCustomErrors(prev => { const n = { ...prev }; delete n['moral_rfc_format']; return n; });
  };

  // Validación en tiempo real de CURP/RFC
  const getCurpError = (value: string) => { if (!value || value.length < 18) return null; return validateCurp(value); };
  const getRfcError = (value: string, isMoral: boolean) => { if (!value || value.length < (isMoral ? 12 : 13)) return null; return validateRfc(value, isMoral); };

  // Pieza y contraseña
  const [numeroPieza, setNumeroPieza] = useState('');
  const [contrasenaINM, setContrasenaINM] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [confirmRfcINM, setConfirmRfcINM] = useState(false);

  // Errores de validación por campo
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const hasError = (field: string) => fieldErrors[field] === true;
  const inputClass = (field: string) => `w-full px-3 py-2.5 border rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 ${hasError(field) ? 'border-red-500/60 bg-red-900/10' : 'border-[#2a2a2a] bg-[#171717]/80 text-white hover:border-[#404040]'}`;
  const inputClassUpper = (field: string) => `w-full px-3 py-2.5 border rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 ${hasError(field) ? 'border-red-500/60 bg-red-900/10' : 'border-[#2a2a2a] bg-[#171717]/80 text-white hover:border-[#404040]'}`;
  const inputClassEmail = (field: string) => `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 ${hasError(field) ? 'border-red-500/60 bg-red-900/10' : 'border-[#2a2a2a] bg-[#171717]/80 text-white hover:border-[#404040]'}`;

  // Validaciones de CURP y RFC
  const validateCurp = (value: string): string | null => {
    if (!value) return null; // No es obligatorio, solo valida si hay valor
    if (value.length !== 18) return 'La CURP debe tener 18 caracteres';
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
    if (!curpRegex.test(value)) return 'Formato de CURP inválido';
    return null;
  };

  const validateRfc = (value: string, isMoral: boolean = false): string | null => {
    if (!value) return null;
    const expectedLength = isMoral ? 12 : 13;
    if (value.length !== expectedLength) return `El RFC debe tener ${expectedLength} caracteres${isMoral ? '' : ' (con homoclave)'}`;
    const rfcRegex = isMoral
      ? /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/
      : /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;
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

  // Persistir progreso en localStorage para no perder datos si se va la luz/internet
  const STORAGE_KEY = 'tramite_nuevo_draft';
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        // Solo mostrar prompt si hay datos reales guardados
        if (data.selectedTramite) {
          setShowDraftPrompt(true);
        }
      } catch { /* ignorar */ }
    } else {
      setDraftLoaded(true);
    }
  }, []);

  const loadDraft = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.step) setStep(data.step);
        if (data.selectedTramite) setSelectedTramite(data.selectedTramite);
        if (data.extranjero) setExtranjero(prev => ({ ...prev, ...data.extranjero }));
        if (data.numeroPieza) setNumeroPieza(data.numeroPieza);
        if (data.contrasenaINM) setContrasenaINM(data.contrasenaINM);
        if (data.visas) setVisas(data.visas);
        if (data.personasAutorizadas) setPersonasAutorizadas(data.personasAutorizadas);
        if (data.solicitante) setSolicitante(prev => ({ ...prev, ...data.solicitante }));
        if (data.pagoData) setPagoData(prev => ({ ...prev, ...data.pagoData, comprobante: null }));
        toast.info('Se recuperó el borrador del trámite anterior');
      } catch { /* ignorar */ }
    }
    setShowDraftPrompt(false);
    setDraftLoaded(true);
  };

  const discardDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowDraftPrompt(false);
    setDraftLoaded(true);
    toast.success('Borrador descartado. Inicia un trámite nuevo.');
  };

  useEffect(() => {
    if (!draftLoaded) return; // No guardar hasta que el usuario haya decidido
    if (step === 0 && !selectedTramite) return; // No guardar estado vacío
    const data = { step, selectedTramite, extranjero, numeroPieza, contrasenaINM, visas, personasAutorizadas, solicitante, pagoData: { ...pagoData, comprobante: null } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [step, selectedTramite, extranjero, numeroPieza, contrasenaINM, visas, personasAutorizadas, solicitante, pagoData, draftLoaded]);

  const updateExtranjero = (field: string, value: string) => {
    // CURP y RFC siempre en mayúsculas
    const upperFields = ['curp', 'rfc', 'curpExtranjero', 'empleadorRfc'];
    // Campos que NO se capitalizan (emails, selects, etc.)
    const noCapitalizeFields = ['propositoViaje', 'especificaTramite', 'sexo', 'nacionalidad', 'estadoCivil', 'paisNacimiento', 'documentoIdentificacion', 'paisExpedicion', 'actividadPrincipal', 'sectorTrabajo', 'situacionTrabajo', 'ocupacionTrabajo', 'expulsadoMexico', 'antecedentesPenales', 'solicitanteEmail', 'solicitanteEmailConfirmacion', 'email', 'domEstado', 'domMunicipio', 'empleadorTipoPersona', 'comentarios'];
    // Campos de texto que se capitalizan (primera letra mayúscula de cada palabra)
    const capitalize = (str: string) => str.replace(/\b\w/g, c => c.toUpperCase());
    
    let formatted = value;
    if (upperFields.includes(field)) {
      formatted = value.toUpperCase();
    } else if (!noCapitalizeFields.includes(field) && value) {
      formatted = capitalize(value);
    }
    
    setExtranjero(prev => {
      const updated = { ...prev, [field]: formatted };
      // Limpiar campos de trabajo si cambia la actividad a algo diferente de Trabajar
      if (field === 'actividadPrincipal' && value !== 'Trabajar') {
        updated.sectorTrabajo = '';
        updated.situacionTrabajo = '';
        updated.ocupacionTrabajo = '';
      }
      return updated;
    });
    if (fieldErrors[field]) setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
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
      // propositoViaje solo es requerido para visa, permiso_trabajo, notificacion_cambio, expedicion_documento, regularizacion y cambio_condicion
      if ((selectedTramite?.tipo === 'visa' || selectedTramite?.tipo === 'permiso_trabajo' || selectedTramite?.tipo === 'notificacion_cambio' || selectedTramite?.tipo === 'expedicion_documento' || selectedTramite?.tipo === 'regularizacion_migratoria' || selectedTramite?.tipo === 'cambio_condicion_estancia') && !extranjero.propositoViaje) errors['propositoViaje'] = true;
      if ((selectedTramite?.tipo === 'notificacion_cambio' || selectedTramite?.tipo === 'expedicion_documento' || selectedTramite?.tipo === 'regularizacion_migratoria' || selectedTramite?.tipo === 'cambio_condicion_estancia') && !extranjero.especificaTramite) errors['especificaTramite'] = true;
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
      // Campos solo para visa
      if (selectedTramite?.tipo === 'visa') {
        if (!extranjero.actividadPrincipal) errors['actividadPrincipal'] = true;
        if (extranjero.actividadPrincipal === 'Trabajar') {
          if (!extranjero.sectorTrabajo) errors['sectorTrabajo'] = true;
          if (!extranjero.situacionTrabajo) errors['situacionTrabajo'] = true;
          if (!extranjero.ocupacionTrabajo) errors['ocupacionTrabajo'] = true;
        }
        if (!extranjero.expulsadoMexico) errors['expulsadoMexico'] = true;
        if (!extranjero.antecedentesPenales) errors['antecedentesPenales'] = true;
        if (!solicitante.tipoPersona) errors['tipoPersona'] = true;
        if (solicitante.tipoPersona === 'Física') {
          if (!solicitante.nombre.trim()) errors['sol_nombre'] = true;
          if (!solicitante.apellidos.trim()) errors['sol_apellidos'] = true;
          if (!solicitante.nacionalidad) errors['sol_nacionalidad'] = true;
          if (!solicitante.tipoDocumento) errors['sol_tipoDocumento'] = true;
          if (!solicitante.numeroDocumento.trim()) errors['sol_numeroDocumento'] = true;
          if (!solicitante.vinculoParentesco) errors['sol_vinculoParentesco'] = true;
          if (!solicitante.codigoPostal.trim()) errors['sol_codigoPostal'] = true;
          if (!solicitante.estado) errors['sol_estado'] = true;
          if (!solicitante.municipio) errors['sol_municipio'] = true;
          if (!solicitante.colonia.trim()) errors['sol_colonia'] = true;
          if (!solicitante.calle.trim()) errors['sol_calle'] = true;
          if (!solicitante.numeroExterior.trim()) errors['sol_numeroExterior'] = true;
        }
      }
      // Campos solo para permisos, expedición de documento, regularización y cambio condición
      if (selectedTramite?.tipo === 'permiso_trabajo' || selectedTramite?.tipo === 'expedicion_documento' || selectedTramite?.tipo === 'regularizacion_migratoria' || selectedTramite?.tipo === 'cambio_condicion_estancia') {
        if (!extranjero.domCodigoPostal.trim()) errors['domCodigoPostal'] = true;
        if (!extranjero.domEstado) errors['domEstado'] = true;
        if (!extranjero.domMunicipio) errors['domMunicipio'] = true;
        if (!extranjero.domColonia.trim()) errors['domColonia'] = true;
        if (!extranjero.domCalle.trim()) errors['domCalle'] = true;
        if (!extranjero.domNumeroExterior.trim()) errors['domNumeroExterior'] = true;
      }
      if (selectedTramite?.tipo === 'visa' && solicitante.tipoPersona === 'Moral') {
        if (!solicitante.moralRfc.trim()) errors['moral_rfc'] = true;
        if (!solicitante.moralRazonSocial.trim()) errors['moral_razonSocial'] = true;
        if (!solicitante.moralCodigoPostal.trim()) errors['moral_codigoPostal'] = true;
        if (!solicitante.moralEstado) errors['moral_estado'] = true;
        if (!solicitante.moralMunicipio) errors['moral_municipio'] = true;
        if (!solicitante.moralColonia.trim()) errors['moral_colonia'] = true;
        if (!solicitante.moralCalle.trim()) errors['moral_calle'] = true;
        if (!solicitante.moralNumeroExterior.trim()) errors['moral_numeroExterior'] = true;
        if (!confirmRfcINM) errors['confirmRfcINM'] = true;
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
        const rfcErr = validateRfc(solicitante.rfc, false);
        if (rfcErr) cErrors['sol_rfc'] = rfcErr;
      }
      if (solicitante.tipoPersona === 'Moral') {
        const rfcErr = validateRfc(solicitante.moralRfc, true);
        if (rfcErr) cErrors['moral_rfc_format'] = rfcErr;
      }
      setCustomErrors(cErrors);

      if (Object.keys(errors).length > 0 || Object.keys(cErrors).length > 0) {
        toast.error('Completa todos los campos obligatorios marcados con *');
        return;
      }
    }
    if (step === 2) {
      if (!numeroPieza.trim()) { toast.error('Ingresa el número de pieza que generó el INM'); return; }
      if (!contrasenaINM.trim()) { toast.error('Ingresa la clave que generó el INM'); return; }
      if (!pdfFile) { toast.error('Sube el PDF de la solicitud generada por el INM'); return; }
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
        datosFormulario: { ...extranjero, visas, personasAutorizadas, solicitante, numeroPiezaINM: numeroPieza, contrasenaINM, pago: pagoData.monto ? { concepto: pagoData.concepto, monto: parseFloat(pagoData.monto), metodoPago: pagoData.metodoPago, referencia: pagoData.referencia } : undefined },
        esBorrador: false,
      });
      const tramiteId = tramiteRes.data.id;

      // Asignar el gestor del trámite al cliente
      if (tramiteRes.data.asesorId) {
        await api.patch(`/clientes/${clienteId}/asesor`, { asesorId: tramiteRes.data.asesorId }).catch(() => {});
      }

      if (pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        formData.append('nombre', 'Solicitud generada por el INM');
        formData.append('categoria', 'solicitud');
        formData.append('tramiteId', tramiteId);
        await api.post('/documentos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {});
      }

      toast.success('Trámite iniciado exitosamente');
      localStorage.removeItem(STORAGE_KEY);
      
      // Si es gestor, notificar al admin que hay un nuevo trámite pendiente de pago
      if (!isAdmin) {
        try {
          await api.post('/notificaciones/enviar-requisitos', {
            email: 'admin@migracion-segura.mx', // TODO: obtener email del admin dinámicamente
            nombreExtranjero: `Gestor: ${user?.fullName || 'Sin nombre'}`,
            requisitos: [`Nuevo trámite creado por ${user?.fullName} para ${extranjero.nombre} ${extranjero.apellidos}. Pendiente de captura de pago.`],
          });
        } catch { /* no bloquear */ }
      }

      router.push(`/tramites/${tramiteId}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al crear trámite');
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      {/* Modal de borrador existente */}
      {showDraftPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#171717] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Borrador encontrado</h2>
            <p className="text-sm text-white/40 mb-6">
              Tienes un trámite sin terminar guardado. ¿Deseas continuar donde te quedaste o empezar uno nuevo?
            </p>
            <div className="flex gap-3">
              <button
                onClick={discardDraft}
                className="flex-1 px-4 py-2.5 border border-[#2a2a2a] text-white/70 rounded-xl text-sm font-medium hover:bg-[#141414] transition-colors"
              >
                Empezar nuevo
              </button>
              <button
                onClick={loadDraft}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-200/30 transition-all"
              >
                Continuar borrador
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <Link href="/tramites" className="p-2 rounded-lg hover:bg-[#1f1f1f] text-amber-400 border border-cyan-900/50 transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-900/20"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-amber-400">Iniciar Trámite Migratorio</h1>
      </div>

      {/* Stepper futurista */}
      <div className="dark-card p-5 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 shimmer-bg pointer-events-none" />
        <div className="flex items-center justify-between overflow-x-auto relative z-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-shrink-0">
              <div className={`flex items-center justify-center h-9 w-9 rounded-full text-sm font-semibold transition-all duration-500 ${i < step ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 amber-glow' : i === step ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-cyan-500/30 ring-4 ring-cyan-500/20 amber-glow' : 'bg-[#1f1f1f] text-white/30 border border-[#2a2a2a]'}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden lg:inline transition-colors duration-300 ${i === step ? 'font-semibold text-amber-400' : i < step ? 'font-medium text-emerald-400' : 'text-white/30'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`hidden lg:block w-8 h-0.5 mx-2 rounded transition-all duration-500 ${i < step ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-[#262626]'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="dark-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-purple-500/[0.02] pointer-events-none" />
        {/* Step 0: Seleccionar trámite */}
        {step === 0 && (
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-amber-400 mb-2">Selecciona el trámite</h3>
            <p className="text-sm text-white/40 mb-6">Haz clic en el tipo de trámite para comenzar</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {TRAMITES_INM.map((t, idx) => (
                <button key={t.tipo} type="button" onClick={() => { setSelectedTramite(t); setStep(1); }} className={`group relative text-left p-6 rounded-2xl border transition-all duration-500 overflow-hidden bg-[#171717]/80 border-[#2a2a2a]/50 hover:border-amber-500/60 hover:shadow-xl hover:shadow-amber-900/20 hover:scale-[1.03] animate-fade-in-up stagger-${idx + 1}`} style={{ opacity: 0 }}>
                  {/* Número decorativo */}
                  <div className="absolute top-3 right-3 flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold transition-all duration-500 bg-[#1f1f1f] text-white/30 border border-[#2a2a2a] group-hover:bg-cyan-500/20 group-hover:text-amber-400 group-hover:border-cyan-500/50 group-hover:shadow-lg group-hover:shadow-cyan-500/20">{idx + 1}</div>
                  {/* Barra lateral decorativa con glow */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all duration-500 bg-[#1f1f1f] group-hover:bg-gradient-to-b group-hover:from-amber-400 group-hover:to-amber-600 group-hover:shadow-[0_0_8px_rgba(0,212,255,0.5)]" />
                  <p className="text-base font-bold leading-tight pr-10 text-white/80 group-hover:text-amber-200 transition-colors">{t.nombre}</p>
                  <p className="text-xs text-white/40 mt-2 leading-relaxed group-hover:text-white/60 transition-colors">{t.descripcion}</p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-8px] group-hover:translate-x-0">Comenzar →</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Datos del extranjero - idéntico al formulario INM */}
        {step === 1 && selectedTramite?.tipo !== 'constancia_empleador' && (
          <div className="space-y-6">
            {/* Sección condicional: Propósito del viaje (solo Visas) */}
            {selectedTramite?.tipo === 'visa' && (
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 pb-3 border-b-2 border-amber-500/20 text-amber-400">Propósito del viaje</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Propósito de viaje *</label><select value={extranjero.propositoViaje} onChange={e => updateExtranjero('propositoViaje', e.target.value)} className={inputClass('propositoViaje')}><option value="">Selecciona</option>{PROPOSITOS_VIAJE.map(p => <option key={p} value={p}>{p}</option>)}</select><ErrorMsg field="propositoViaje" /></div>
              </div>
            </div>
            )}

            {/* Sección condicional: Tipo de trámite (solo Permisos) */}
            {selectedTramite?.tipo === 'permiso_trabajo' && (
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 pb-3 border-b-2 border-amber-500/20 text-amber-400">Tipo de trámite</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">¿Qué deseas hacer? *</label><select value={extranjero.propositoViaje} onChange={e => { updateExtranjero('propositoViaje', e.target.value); if (e.target.value !== 'Obtener permiso para trabajar') updateExtranjero('especificaTramite', ''); }} className={inputClass('propositoViaje')}><option value="">Selecciona</option><option value="Obtener permiso para trabajar">Obtener permiso para trabajar</option><option value="Obtener permiso de salida y regreso">Obtener permiso de salida y regreso</option></select><ErrorMsg field="propositoViaje" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Especifica *</label><select value={extranjero.especificaTramite} onChange={e => updateExtranjero('especificaTramite', e.target.value)} disabled={extranjero.propositoViaje !== 'Obtener permiso para trabajar'} className={`w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040] ${extranjero.propositoViaje !== 'Obtener permiso para trabajar' ? 'bg-[#1f1f1f] text-white/30 cursor-not-allowed' : ''}`}><option value="">Selecciona</option><option value="Con empleador">Obtener permiso para trabajar con empleador</option><option value="Independiente/autoempleo">Obtener permiso para trabajar (actividades independientes/autoempleo)</option></select></div>
              </div>
            </div>
            )}

            {/* Sección condicional: Tipo de trámite (solo Notificación de Cambio) */}
            {selectedTramite?.tipo === 'notificacion_cambio' && (
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 pb-3 border-b-2 border-amber-500/20 text-amber-400">Tipo de trámite</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">¿Qué deseas hacer? *</label><select value={extranjero.propositoViaje} onChange={e => updateExtranjero('propositoViaje', e.target.value)} className={inputClass('propositoViaje')}><option value="">Selecciona</option><option value="Notificar cambios (residentes temporales y permanentes)">Notificar cambios (residentes temporales y permanentes)</option></select><ErrorMsg field="propositoViaje" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Especifica *</label><select value={extranjero.especificaTramite} onChange={e => updateExtranjero('especificaTramite', e.target.value)} className={inputClass('especificaTramite')}><option value="">Selecciona</option><option value="Notificación de cambio de lugar de trabajo">Notificación de cambio de lugar de trabajo</option><option value="Notificación de cambio de domicilio">Notificación de cambio de domicilio</option><option value="Notificación de cambio de nacionalidad">Notificación de cambio de nacionalidad</option><option value="Notificación de cambio de estado civil">Notificación de cambio de estado civil</option><option value="Notificación de cambio de nombre">Notificación de cambio de nombre</option></select><ErrorMsg field="especificaTramite" /></div>
              </div>
            </div>
            )}

            {/* Sección condicional: Tipo de trámite (solo Expedición de Documento) */}
            {selectedTramite?.tipo === 'expedicion_documento' && (
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 pb-3 border-b-2 border-amber-500/20 text-amber-400">Tipo de trámite</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">¿Qué deseas hacer? *</label><select value={extranjero.propositoViaje} onChange={e => { updateExtranjero('propositoViaje', e.target.value); updateExtranjero('especificaTramite', ''); }} className={inputClass('propositoViaje')}><option value="">Selecciona</option><option value="Extender la estancia">Extender la estancia</option><option value="Canjear o reponer documento migratorio">Canjear o reponer documento migratorio</option></select><ErrorMsg field="propositoViaje" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Especifica *</label><select value={extranjero.especificaTramite} onChange={e => updateExtranjero('especificaTramite', e.target.value)} disabled={!extranjero.propositoViaje} className={`w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040] ${!extranjero.propositoViaje ? 'bg-[#1f1f1f] text-white/30 cursor-not-allowed' : ''}`}><option value="">Selecciona</option>{extranjero.propositoViaje === 'Extender la estancia' && (<><option value="Expedición de Tarjeta de Residente por Renovación">Expedición de Tarjeta de Residente por Renovación</option><option value="Expedición de Tarjeta de Visitante por Ampliación">Expedición de Tarjeta de Visitante por Ampliación</option></>)}{extranjero.propositoViaje === 'Canjear o reponer documento migratorio' && (<><option value="Canje de FMM por Tarjeta de Visitante o de Residente">Canje de FMM por Tarjeta de Visitante o de Residente</option><option value="Reposición de documento migratorio por pérdida, robo o deterioro">Reposición de documento migratorio por pérdida, robo o deterioro</option><option value="Expedición de Tarjeta de Residente cuando se otorga la condición por acuerdo">Expedición de Tarjeta de Residente cuando se otorga la condición por acuerdo</option></>)}</select><ErrorMsg field="especificaTramite" /></div>
              </div>
            </div>
            )}

            {/* Sección condicional: Tipo de trámite (solo Regularización) */}
            {selectedTramite?.tipo === 'regularizacion_migratoria' && (
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 pb-3 border-b-2 border-amber-500/20 text-amber-400">Tipo de trámite</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">¿Qué deseas hacer? *</label><select value={extranjero.propositoViaje} onChange={e => updateExtranjero('propositoViaje', e.target.value)} className={inputClass('propositoViaje')}><option value="">Selecciona</option><option value="Regularizar situación migratoria">Regularizar situación migratoria</option></select><ErrorMsg field="propositoViaje" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Especifica *</label><select value={extranjero.especificaTramite} onChange={e => updateExtranjero('especificaTramite', e.target.value)} className={inputClass('especificaTramite')}><option value="">Selecciona</option><option value="Regularización por unidad familiar">Regularización por unidad familiar</option><option value="Regularización por razones humanitarias">Regularización por razones humanitarias</option><option value="Regularización por tener documento vencido o por realizar actividades no autorizadas">Regularización por tener documento vencido o por realizar actividades no autorizadas</option></select><ErrorMsg field="especificaTramite" /></div>
              </div>
            </div>
            )}

            {/* Sección condicional: Tipo de trámite (solo Cambio de Condición de Estancia) */}
            {selectedTramite?.tipo === 'cambio_condicion_estancia' && (
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 pb-3 border-b-2 border-amber-500/20 text-amber-400">Tipo de trámite</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">¿Qué deseas hacer? *</label><select value={extranjero.propositoViaje} onChange={e => updateExtranjero('propositoViaje', e.target.value)} className={inputClass('propositoViaje')}><option value="">Selecciona</option><option value="Cambiar condición de estancia">Cambiar condición de estancia</option></select><ErrorMsg field="propositoViaje" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Especifica *</label><select value={extranjero.especificaTramite} onChange={e => updateExtranjero('especificaTramite', e.target.value)} className={inputClass('especificaTramite')}><option value="">Selecciona</option><option value="Cambio de condición a residente permanente por unidad familiar">Cambio de condición a residente permanente por unidad familiar</option><option value="Cambio de condición a residente temporal por unidad familiar">Cambio de condición a residente temporal por unidad familiar</option><option value="Cambio de condición a visitante por razones humanitarias">Cambio de condición a visitante por razones humanitarias</option><option value="Cambio de condición de visitante por razones humanitarias a residente permanente">Cambio de condición de visitante por razones humanitarias a residente permanente</option><option value="Cambio de condición de visitante por razones humanitarias a residente temporal">Cambio de condición de visitante por razones humanitarias a residente temporal</option><option value="Cambio de condición de residente temporal estudiante a residente temporal">Cambio de condición de residente temporal estudiante a residente temporal</option><option value="Cambio de condición de residente temporal a residente permanente">Cambio de condición de residente temporal a residente permanente</option></select><ErrorMsg field="especificaTramite" /></div>
              </div>
            </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 pb-3 border-b-2 border-amber-500/20 text-amber-400">Datos del extranjero (conforme a pasaporte o documento de identidad)</h3>
              {/* CURP para permisos, notificación de cambio, expedición de documento, regularización y cambio condición */}
              {(selectedTramite?.tipo === 'permiso_trabajo' || selectedTramite?.tipo === 'notificacion_cambio' || selectedTramite?.tipo === 'expedicion_documento' || selectedTramite?.tipo === 'regularizacion_migratoria' || selectedTramite?.tipo === 'cambio_condicion_estancia') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mb-4">
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Clave Única de Registro de Población (CURP)</label><input type="text" value={extranjero.curpExtranjero} onChange={e => updateExtranjero('curpExtranjero', e.target.value.toUpperCase())} className={inputClassUpper('curpExtranjero')} maxLength={18} />{extranjero.curpExtranjero && validateCurp(extranjero.curpExtranjero) && <p className="text-[11px] text-red-500 mt-1">{validateCurp(extranjero.curpExtranjero)}</p>}</div>
              </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Nombre(s) *</label><input type="text" value={extranjero.nombre} onChange={e => updateExtranjero('nombre', e.target.value)} className={inputClass('nombre')} /><ErrorMsg field="nombre" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Apellido(s) *</label><input type="text" value={extranjero.apellidos} onChange={e => updateExtranjero('apellidos', e.target.value)} className={inputClass('apellidos')} /><ErrorMsg field="apellidos" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Sexo *</label><select value={extranjero.sexo} onChange={e => updateExtranjero('sexo', e.target.value)} className={inputClass('sexo')}><option value="">Selecciona</option>{SEXOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select><ErrorMsg field="sexo" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Fecha de nacimiento *</label><DatePicker value={extranjero.fechaNacimiento} onChange={v => updateExtranjero('fechaNacimiento', v)} yearRange={[1940, 2010]} /><ErrorMsg field="fechaNacimiento" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Nacionalidad actual *</label><select value={extranjero.nacionalidad} onChange={e => updateExtranjero('nacionalidad', e.target.value)} className={inputClass('nacionalidad')}><option value="">Selecciona</option>{NACIONALIDADES.map(n => <option key={n} value={n}>{n}</option>)}</select><ErrorMsg field="nacionalidad" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Estado civil actual</label><select value={extranjero.estadoCivil} onChange={e => updateExtranjero('estadoCivil', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]"><option value="">Selecciona</option>{ESTADOS_CIVILES.map(ec => <option key={ec.value} value={ec.value}>{ec.label}</option>)}</select></div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 pb-3 border-b-2 border-amber-500/20 text-amber-400">Lugar de nacimiento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">País de nacimiento *</label><select value={extranjero.paisNacimiento} onChange={e => updateExtranjero('paisNacimiento', e.target.value)} className={inputClass('paisNacimiento')}><option value="">Selecciona</option>{PAISES.map(p => <option key={p} value={p}>{p}</option>)}</select><ErrorMsg field="paisNacimiento" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Estado, provincia o departamento *</label><input type="text" value={extranjero.estadoProvinciaNacimiento} onChange={e => updateExtranjero('estadoProvinciaNacimiento', e.target.value)} className={inputClass('estadoProvinciaNacimiento')} /><ErrorMsg field="estadoProvinciaNacimiento" /></div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 pb-3 border-b-2 border-amber-500/20 text-amber-400">Pasaporte o documento con el que se identifica el extranjero</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Documento de identificación *</label><select value={extranjero.documentoIdentificacion} onChange={e => updateExtranjero('documentoIdentificacion', e.target.value)} className={inputClass('documentoIdentificacion')}><option value="">Selecciona</option>{DOCUMENTOS_IDENTIFICACION.map(d => <option key={d} value={d}>{d}</option>)}</select><ErrorMsg field="documentoIdentificacion" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Número de documento *</label><input type="text" value={extranjero.numeroDocumento} onChange={e => updateExtranjero('numeroDocumento', e.target.value)} className={inputClass('numeroDocumento')} /><ErrorMsg field="numeroDocumento" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">País de expedición *</label><select value={extranjero.paisExpedicion} onChange={e => updateExtranjero('paisExpedicion', e.target.value)} className={inputClass('paisExpedicion')}><option value="">Selecciona</option>{PAISES.map(p => <option key={p} value={p}>{p}</option>)}</select><ErrorMsg field="paisExpedicion" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Fecha de expedición</label><DatePicker value={extranjero.fechaExpedicion} onChange={v => updateExtranjero('fechaExpedicion', v)} yearRange={[2000, 2026]} /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Fecha de vencimiento</label><DatePicker value={extranjero.fechaVencimiento} onChange={v => updateExtranjero('fechaVencimiento', v)} yearRange={[2024, 2040]} /></div>
              </div>
            </div>

            {/* Domicilio del extranjero en México (Permisos, Expedición de Documento, Regularización y Cambio Condición) */}
            {(selectedTramite?.tipo === 'permiso_trabajo' || selectedTramite?.tipo === 'expedicion_documento' || selectedTramite?.tipo === 'regularizacion_migratoria' || selectedTramite?.tipo === 'cambio_condicion_estancia') && (
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 pb-3 border-b-2 border-amber-500/20 text-amber-400">Domicilio del extranjero en México</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Código postal *</label><input type="text" value={extranjero.domCodigoPostal} onChange={e => updateExtranjero('domCodigoPostal', e.target.value)} className={inputClass('domCodigoPostal')} /><ErrorMsg field="domCodigoPostal" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Estado *</label><select value={extranjero.domEstado} onChange={e => { updateExtranjero('domEstado', e.target.value); updateExtranjero('domMunicipio', ''); }} className={inputClass('domEstado')}><option value="">Selecciona</option>{ESTADOS_MEXICO.map(est => <option key={est} value={est}>{est}</option>)}</select><ErrorMsg field="domEstado" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Municipio o Alcaldía *</label><select value={extranjero.domMunicipio} onChange={e => updateExtranjero('domMunicipio', e.target.value)} className={inputClass('domMunicipio')}><option value="">Selecciona</option>{(MUNICIPIOS_POR_ESTADO[extranjero.domEstado] || []).map(m => <option key={m} value={m}>{m}</option>)}</select><ErrorMsg field="domMunicipio" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Colonia *</label><input type="text" value={extranjero.domColonia} onChange={e => updateExtranjero('domColonia', e.target.value)} className={inputClass('domColonia')} /><ErrorMsg field="domColonia" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Calle *</label><input type="text" value={extranjero.domCalle} onChange={e => updateExtranjero('domCalle', e.target.value)} className={inputClass('domCalle')} /><ErrorMsg field="domCalle" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Número exterior *</label><input type="text" value={extranjero.domNumeroExterior} onChange={e => updateExtranjero('domNumeroExterior', e.target.value)} className={inputClass('domNumeroExterior')} /><ErrorMsg field="domNumeroExterior" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Número interior</label><input type="text" value={extranjero.domNumeroInterior} onChange={e => updateExtranjero('domNumeroInterior', e.target.value)} className="w-full px-3 py-2.5 border border-[#333333] bg-[#1a1a1a] rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm hover:shadow transition-shadow" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Lada</label><input type="text" value={extranjero.domLada} onChange={e => updateExtranjero('domLada', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Teléfono fijo</label><input type="text" value={extranjero.domTelefonoFijo} onChange={e => updateExtranjero('domTelefonoFijo', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
              </div>
            </div>
            )}

            {/* Datos del empleador (permiso trabajar con empleador O regularización por doc vencido) */}
            {((selectedTramite?.tipo === 'permiso_trabajo' && extranjero.propositoViaje === 'Obtener permiso para trabajar' && extranjero.especificaTramite === 'Con empleador') || (selectedTramite?.tipo === 'regularizacion_migratoria' && extranjero.especificaTramite === 'Regularización por tener documento vencido o por realizar actividades no autorizadas')) && (
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 pb-3 border-b-2 border-amber-500/20 text-amber-400">Datos del empleador</h3>
              <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-400 text-center">Si presenta oferta de empleo, proporcione los datos del empleador.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Tipo de persona *</label><select value={extranjero.empleadorTipoPersona} onChange={e => updateExtranjero('empleadorTipoPersona', e.target.value)} className={inputClass('empleadorTipoPersona')}><option value="">Selecciona</option><option value="Física">Física</option><option value="Moral">Moral</option></select><ErrorMsg field="empleadorTipoPersona" /></div>
                {extranjero.empleadorTipoPersona && (
                <>
                  <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Registro Federal de Contribuyentes (RFC) *</label><input type="text" value={extranjero.empleadorRfc} onChange={e => updateExtranjero('empleadorRfc', e.target.value.toUpperCase())} className={inputClassUpper('empleadorRfc')} maxLength={extranjero.empleadorTipoPersona === 'Moral' ? 12 : 13} /><ErrorMsg field="empleadorRfc" /></div>
                  <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Número expediente *</label><input type="text" value={extranjero.empleadorNumeroExpediente} onChange={e => updateExtranjero('empleadorNumeroExpediente', e.target.value)} className={inputClass('empleadorNumeroExpediente')} /><ErrorMsg field="empleadorNumeroExpediente" /></div>
                </>
                )}
              </div>
            </div>
            )}

            {/* Información adicional (solo Visas) */}
            {selectedTramite?.tipo === 'visa' && (
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 pb-3 border-b-2 border-amber-500/20 text-amber-400">Información adicional del extranjero</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Actividad principal en tu país de residencia *</label><select value={extranjero.actividadPrincipal} onChange={e => updateExtranjero('actividadPrincipal', e.target.value)} className={inputClass('actividadPrincipal')}><option value="">Selecciona</option>{ACTIVIDADES_PRINCIPALES.map(a => <option key={a} value={a}>{a}</option>)}</select><ErrorMsg field="actividadPrincipal" /></div>
                {extranjero.actividadPrincipal === 'Trabajar' && (
                  <>
                    <div className="md:col-span-2"><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Sector o rama de actividad de la empresa o trabajo *</label><select value={extranjero.sectorTrabajo} onChange={e => updateExtranjero('sectorTrabajo', e.target.value)} className={inputClass('sectorTrabajo')}><option value="">Selecciona</option>{SECTORES_ACTIVIDAD.map(s => <option key={s} value={s}>{s}</option>)}</select><ErrorMsg field="sectorTrabajo" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Situación en el trabajo *</label><select value={extranjero.situacionTrabajo} onChange={e => updateExtranjero('situacionTrabajo', e.target.value)} className={inputClass('situacionTrabajo')}><option value="">Selecciona</option>{SITUACIONES_TRABAJO.map(s => <option key={s} value={s}>{s}</option>)}</select><ErrorMsg field="situacionTrabajo" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Ocupación en el trabajo *</label><select value={extranjero.ocupacionTrabajo} onChange={e => updateExtranjero('ocupacionTrabajo', e.target.value)} className={inputClass('ocupacionTrabajo')}><option value="">Selecciona</option>{OCUPACIONES_TRABAJO.map(o => <option key={o} value={o}>{o}</option>)}</select><ErrorMsg field="ocupacionTrabajo" /></div>
                  </>
                )}
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">¿Has sido expulsado de México? *</label><select value={extranjero.expulsadoMexico} onChange={e => updateExtranjero('expulsadoMexico', e.target.value)} className={inputClass('expulsadoMexico')}><option value="">Selecciona</option>{SI_NO.map(o => <option key={o} value={o}>{o}</option>)}</select><ErrorMsg field="expulsadoMexico" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">¿Tienes antecedentes penales? *</label><select value={extranjero.antecedentesPenales} onChange={e => updateExtranjero('antecedentesPenales', e.target.value)} className={inputClass('antecedentesPenales')}><option value="">Selecciona</option>{SI_NO.map(o => <option key={o} value={o}>{o}</option>)}</select><ErrorMsg field="antecedentesPenales" /></div>
              </div>
            </div>
            )}

            {/* Señala las visas (solo Visas) */}
            {selectedTramite?.tipo === 'visa' && (
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 pb-3 border-b-2 border-amber-500/20 text-amber-400">Señala las visas con las que cuenta el extranjero</h3>
              <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-400 text-center">Si deseas agregar visas será necesario que lo efectúes con el botón &apos;Agregar visa&apos;, de lo contrario los datos de esta sección no serán guardados.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl items-end">
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">País</label><select value={visaTemp.pais} onChange={e => setVisaTemp(prev => ({ ...prev, pais: e.target.value }))} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]"><option value="">Selecciona</option>{PAISES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Número</label><input type="text" value={visaTemp.numero} onChange={e => setVisaTemp(prev => ({ ...prev, numero: e.target.value }))} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1"><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Fecha de vencimiento</label><DatePicker value={visaTemp.vencimiento} onChange={v => setVisaTemp(prev => ({ ...prev, vencimiento: v }))} yearRange={[2024, 2040]} /></div>
                  <button type="button" onClick={handleAddVisa} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors whitespace-nowrap">Agregar visa</button>
                </div>
              </div>
              {visas.length > 0 && (
                <div className="mt-4 max-w-4xl">
                  <table className="w-full text-sm border rounded-lg overflow-hidden">
                    <thead><tr className="bg-[#141414] border-b"><th className="text-left px-3 py-2 text-xs font-medium text-white/40">País</th><th className="text-left px-3 py-2 text-xs font-medium text-white/40">Número</th><th className="text-left px-3 py-2 text-xs font-medium text-white/40">Vencimiento</th><th className="px-3 py-2"></th></tr></thead>
                    <tbody>{visas.map((v, i) => (<tr key={i} className="border-b last:border-0"><td className="px-3 py-2">{v.pais}</td><td className="px-3 py-2">{v.numero}</td><td className="px-3 py-2">{v.vencimiento}</td><td className="px-3 py-2 text-right"><button type="button" onClick={() => handleRemoveVisa(i)} className="text-xs text-red-500 hover:text-red-400">Eliminar</button></td></tr>))}</tbody>
                  </table>
                </div>
              )}
            </div>
            )}

            {/* Datos de la institución (solo Visas) */}
            {selectedTramite?.tipo === 'visa' && (
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 pb-3 border-b-2 border-amber-500/20 text-amber-400">Datos de la institución, organismo o persona que solicita la autorización de la visa</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Tipo de persona *</label><select value={solicitante.tipoPersona} onChange={e => { updateSolicitante('tipoPersona', e.target.value); if (fieldErrors['tipoPersona']) setFieldErrors(prev => { const n = { ...prev }; delete n['tipoPersona']; return n; }); }} className={inputClass('tipoPersona')}><option value="">Selecciona</option>{TIPOS_PERSONA.map(t => <option key={t} value={t}>{t}</option>)}</select><ErrorMsg field="tipoPersona" /></div>
              </div>

              {solicitante.tipoPersona === 'Física' && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-semibold text-white/90 border-b pb-1">Datos de la persona física</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">CURP</label><input type="text" value={solicitante.curp} onChange={e => updateSolicitante('curp', e.target.value)} className={`${inputClassUpper('curp')} ${getCurpError(solicitante.curp) ? 'border-red-400 bg-red-500/10/30' : ''}`} maxLength={18} />{getCurpError(solicitante.curp) && <p className="text-[11px] text-red-500 mt-1">{getCurpError(solicitante.curp)}</p>}<CustomErrorMsg field="sol_curp" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">RFC</label><input type="text" value={solicitante.rfc} onChange={e => updateSolicitante('rfc', e.target.value)} className={`${inputClassUpper('rfc')} ${getRfcError(solicitante.rfc, false) ? 'border-red-400 bg-red-500/10/30' : ''}`} maxLength={13} />{getRfcError(solicitante.rfc, false) && <p className="text-[11px] text-red-500 mt-1">{getRfcError(solicitante.rfc, false)}</p>}<CustomErrorMsg field="sol_rfc" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Nombre(s) *</label><input type="text" value={solicitante.nombre} onChange={e => updateSolicitante('nombre', e.target.value)} className="w-full px-3 py-2.5 border border-[#333333] bg-[#1a1a1a] rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm hover:shadow transition-shadow" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Apellido(s) *</label><input type="text" value={solicitante.apellidos} onChange={e => updateSolicitante('apellidos', e.target.value)} className="w-full px-3 py-2.5 border border-[#333333] bg-[#1a1a1a] rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm hover:shadow transition-shadow" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Nacionalidad actual *</label><select value={solicitante.nacionalidad} onChange={e => updateSolicitante('nacionalidad', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]"><option value="">Selecciona</option>{NACIONALIDADES.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Tipo de documento *</label><select value={solicitante.tipoDocumento} onChange={e => updateSolicitante('tipoDocumento', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]"><option value="">Selecciona</option>{DOCUMENTOS_PERSONA_FISICA.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Número de documento *</label><input type="text" value={solicitante.numeroDocumento} onChange={e => updateSolicitante('numeroDocumento', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                    <div className="md:col-span-3"><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Vínculo o parentesco entre el solicitante y el extranjero *</label><select value={solicitante.vinculoParentesco} onChange={e => updateSolicitante('vinculoParentesco', e.target.value)} className={inputClass('sol_vinculoParentesco')}><option value="">Selecciona</option>{VINCULOS_PARENTESCO.map(v => <option key={v} value={v}>{v}</option>)}</select><ErrorMsg field="sol_vinculoParentesco" /></div>
                  </div>

                  <h4 className="text-sm font-semibold text-white/90 border-b pb-1 pt-2">Domicilio de la persona física</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Código postal *</label><input type="text" value={solicitante.codigoPostal} onChange={e => updateSolicitante('codigoPostal', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Estado *</label><select value={solicitante.estado} onChange={e => { updateSolicitante('estado', e.target.value); updateSolicitante('municipio', ''); }} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]"><option value="">Selecciona</option>{ESTADOS_MEXICO.map(est => <option key={est} value={est}>{est}</option>)}</select></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Municipio o Alcaldía *</label><select value={solicitante.municipio} onChange={e => updateSolicitante('municipio', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]"><option value="">Selecciona</option>{(MUNICIPIOS_POR_ESTADO[solicitante.estado] || []).map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Colonia *</label><input type="text" value={solicitante.colonia} onChange={e => updateSolicitante('colonia', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Calle *</label><input type="text" value={solicitante.calle} onChange={e => updateSolicitante('calle', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Número exterior *</label><input type="text" value={solicitante.numeroExterior} onChange={e => updateSolicitante('numeroExterior', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Número interior</label><input type="text" value={solicitante.numeroInterior} onChange={e => updateSolicitante('numeroInterior', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Lada</label><input type="text" value={solicitante.lada} onChange={e => updateSolicitante('lada', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Teléfono fijo</label><input type="text" value={solicitante.telefonoFijo} onChange={e => updateSolicitante('telefonoFijo', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                  </div>
                </div>
              )}

              {solicitante.tipoPersona === 'Moral' && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-semibold text-white/90 border-b pb-1">Datos de la persona moral</h4>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-sm text-red-800 font-medium">⚠️ Importante: El RFC de la persona moral debe estar dado de alta ante el INM</p>
                    <p className="text-xs text-red-400 mt-1">La empresa debe contar con la Constancia de Inscripción del Empleador vigente y actualizada ante el Instituto Nacional de Migración. Si el RFC no está registrado, el trámite será rechazado por el INM.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">RFC *</label><input type="text" value={solicitante.moralRfc} onChange={e => updateSolicitante('moralRfc', e.target.value)} className={`${inputClassUpper('moral_rfc')} ${getRfcError(solicitante.moralRfc, true) ? 'border-red-400 bg-red-500/10/30' : ''}`} maxLength={12} />{getRfcError(solicitante.moralRfc, true) && <p className="text-[11px] text-red-500 mt-1">{getRfcError(solicitante.moralRfc, true)}</p>}<CustomErrorMsg field="moral_rfc_format" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Nombre o razón social *</label><input type="text" value={solicitante.moralRazonSocial} onChange={e => updateSolicitante('moralRazonSocial', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                    <div className="md:col-span-3"><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Sector o rama de actividad</label><select value={solicitante.moralSector} onChange={e => updateSolicitante('moralSector', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]"><option value="">Selecciona</option>{SECTORES_ACTIVIDAD.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div className="md:col-span-3"><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Objeto de la empresa o giro comercial</label><textarea value={solicitante.moralGiroComercial} onChange={e => updateSolicitante('moralGiroComercial', e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040] resize-none" /></div>
                  </div>

                  <h4 className="text-sm font-semibold text-white/90 border-b pb-1 pt-2">Domicilio de la persona moral</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Código postal *</label><input type="text" value={solicitante.moralCodigoPostal} onChange={e => updateSolicitante('moralCodigoPostal', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Estado *</label><select value={solicitante.moralEstado} onChange={e => { updateSolicitante('moralEstado', e.target.value); updateSolicitante('moralMunicipio', ''); }} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]"><option value="">Selecciona</option>{ESTADOS_MEXICO.map(est => <option key={est} value={est}>{est}</option>)}</select></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Municipio o Alcaldía *</label><select value={solicitante.moralMunicipio} onChange={e => updateSolicitante('moralMunicipio', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]"><option value="">Selecciona</option>{(MUNICIPIOS_POR_ESTADO[solicitante.moralEstado] || []).map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Colonia *</label><input type="text" value={solicitante.moralColonia} onChange={e => updateSolicitante('moralColonia', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Calle *</label><input type="text" value={solicitante.moralCalle} onChange={e => updateSolicitante('moralCalle', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Número exterior *</label><input type="text" value={solicitante.moralNumeroExterior} onChange={e => updateSolicitante('moralNumeroExterior', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Número interior</label><input type="text" value={solicitante.moralNumeroInterior} onChange={e => updateSolicitante('moralNumeroInterior', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Lada</label><input type="text" value={solicitante.moralLada} onChange={e => updateSolicitante('moralLada', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Teléfono fijo</label><input type="text" value={solicitante.moralTelefonoFijo} onChange={e => updateSolicitante('moralTelefonoFijo', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                  </div>

                  <h4 className="text-sm font-semibold text-white/90 border-b pb-1 pt-2">Datos del acta constitutiva</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Número de acta constitutiva</label><input type="text" value={solicitante.moralNumeroActa} onChange={e => updateSolicitante('moralNumeroActa', e.target.value)} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                    <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Fecha de registro del acta</label><DatePicker value={solicitante.moralFechaActa} onChange={v => updateSolicitante('moralFechaActa', v)} yearRange={[1950, 2026]} /></div>
                  </div>

                  {/* Confirmación RFC dado de alta en INM */}
                  <div className="mt-4 p-4 bg-[#141414] border border-[#2a2a2a] rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={confirmRfcINM} onChange={e => setConfirmRfcINM(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-[#333333] text-amber-500 focus:ring-amber-500" />
                      <span className="text-sm text-white/70">Confirmo que el RFC <strong className="font-mono">{solicitante.moralRfc || '___'}</strong> está dado de alta ante el INM y cuenta con la Constancia de Inscripción del Empleador vigente y actualizada.</span>
                    </label>
                    {hasError('confirmRfcINM') && <p className="text-[11px] text-red-500 mt-2 ml-7">Debes confirmar que el RFC está dado de alta en el INM para continuar</p>}
                  </div>
                </div>
              )}
            </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 pb-3 border-b-2 border-amber-500/20 text-amber-400">Correo electrónico para notificar al promovente</h3>
              <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-400 text-center">Agrega la dirección de correo electrónico en donde se recibirán las notificaciones asociadas a tu trámite.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Correo electrónico *</label><input type="email" value={extranjero.solicitanteEmail} onChange={e => updateExtranjero('solicitanteEmail', e.target.value)} className={inputClassEmail('solicitanteEmail')} placeholder="nombre@correo.com" /><ErrorMsg field="solicitanteEmail" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Correo electrónico (confirmación) *</label><input type="email" value={extranjero.solicitanteEmailConfirmacion} onChange={e => updateExtranjero('solicitanteEmailConfirmacion', e.target.value)} className={inputClassEmail('solicitanteEmailConfirmacion')} placeholder="nombre@correo.com" /><ErrorMsg field="solicitanteEmailConfirmacion" /></div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 pb-3 border-b-2 border-amber-500/20 text-amber-400">En su caso, persona autorizada para tramitar, oír o recibir notificaciones</h3>
              <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-400 text-center">Si deseas agregar personas autorizadas es necesario que lo efectúes con el botón &apos;Agregar persona&apos;, de lo contrario los datos capturados en esta sección no serán guardados.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Clave Única de Registro de Población (CURP)</label><input type="text" value={personaTemp.curp} onChange={e => setPersonaTemp(prev => ({ ...prev, curp: e.target.value.toUpperCase() }))} className="w-full px-3 py-2 border border-[#2a2a2a] rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-amber-500" maxLength={18} />{personaTemp.curp && validateCurp(personaTemp.curp) && <p className="text-[11px] text-red-500 mt-1">{validateCurp(personaTemp.curp)}</p>}</div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Nombre(s) *</label><input type="text" value={personaTemp.nombre} onChange={e => setPersonaTemp(prev => ({ ...prev, nombre: e.target.value }))} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Apellido(s) *</label><input type="text" value={personaTemp.apellidos} onChange={e => setPersonaTemp(prev => ({ ...prev, apellidos: e.target.value }))} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Nacionalidad actual *</label><select value={personaTemp.nacionalidad} onChange={e => setPersonaTemp(prev => ({ ...prev, nacionalidad: e.target.value }))} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]"><option value="">Selecciona</option>{NACIONALIDADES.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Tipo de documento de identificación</label><select value={personaTemp.tipoDocumento} onChange={e => setPersonaTemp(prev => ({ ...prev, tipoDocumento: e.target.value }))} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]"><option value="">Selecciona</option>{DOCUMENTOS_IDENTIFICACION_PERSONA.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Número de documento</label><input type="text" value={personaTemp.numeroDocumento} onChange={e => setPersonaTemp(prev => ({ ...prev, numeroDocumento: e.target.value }))} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" /></div>
              </div>
              <div className="flex justify-end mt-4 max-w-4xl">
                <button type="button" onClick={handleAddPersona} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">Agregar persona</button>
              </div>
              {personasAutorizadas.length > 0 && (
                <div className="mt-4 max-w-4xl">
                  <table className="w-full text-sm border rounded-lg overflow-hidden">
                    <thead><tr className="bg-[#141414] border-b"><th className="text-left px-3 py-2 text-xs font-medium text-white/40">Nombre</th><th className="text-left px-3 py-2 text-xs font-medium text-white/40">Nacionalidad</th><th className="text-left px-3 py-2 text-xs font-medium text-white/40">Documento</th><th className="px-3 py-2"></th></tr></thead>
                    <tbody>{personasAutorizadas.map((p, i) => (<tr key={i} className="border-b last:border-0"><td className="px-3 py-2">{p.nombre} {p.apellidos}</td><td className="px-3 py-2">{p.nacionalidad}</td><td className="px-3 py-2">{p.tipoDocumento} {p.numeroDocumento}</td><td className="px-3 py-2 text-right"><button type="button" onClick={() => handleRemovePersona(i)} className="text-xs text-red-500 hover:text-red-400">Eliminar</button></td></tr>))}</tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 pb-3 border-b-2 border-amber-500/20 text-amber-400">Comentarios</h3>
              <p className="text-sm text-white/40 mb-3">Si lo deseas, puedes agregar algún comentario a la solicitud.</p>
              <textarea value={extranjero.comentarios} onChange={e => updateExtranjero('comentarios', e.target.value)} rows={4} className="w-full max-w-4xl px-3 py-2 border border-[#2a2a2a] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              <p className="text-xs text-white/30 mt-2">* Campos obligatorios</p>
            </div>
          </div>
        )}

        {/* Step 1: Formulario CIE (Constancia de Inscripción de Empleador) */}
        {step === 1 && selectedTramite?.tipo === 'constancia_empleador' && (
          <CieForm
            propositoViaje={extranjero.propositoViaje}
            onChangePropositoViaje={(v) => updateExtranjero('propositoViaje', v)}
            solicitanteEmail={extranjero.solicitanteEmail}
            solicitanteEmailConfirmacion={extranjero.solicitanteEmailConfirmacion}
            onChangeEmail={(field, v) => updateExtranjero(field, v)}
            comentarios={extranjero.comentarios}
            onChangeComentarios={(v) => updateExtranjero('comentarios', v)}
            onDataChange={() => {}}
          />
        )}

        {/* Step 2: Solicitud INM — ficha de datos + iframe lado a lado */}
        {step === 2 && selectedTramite && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-white">Llenar Solicitud en el INM</h2>
            </div>
            <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">Usa la ficha de la izquierda como referencia para llenar el formulario del INM a la derecha. Haz clic en cualquier dato para copiarlo.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: '620px' }}>
              {/* Ficha de datos (izquierda) */}
              <div className="lg:col-span-1 overflow-y-auto border rounded-lg p-4 bg-[#141414]">
                <h4 className="text-xs font-semibold text-white/40 uppercase mb-3">Ficha del Extranjero</h4>
                <div className="space-y-4">
                  {/* Propósito de viaje */}
                  {extranjero.propositoViaje && (
                    <div>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-brand-200 pb-1 mb-2">Propósito de viaje</p>
                      <button type="button" onClick={() => copyToClipboard(extranjero.propositoViaje)} className="w-full text-left p-1.5 rounded hover:bg-[#171717] border border-transparent hover:border-[#2a2a2a] transition-all group">
                        <div className="flex items-center justify-between"><p className="text-sm text-white">{extranjero.propositoViaje}</p><Copy className="h-3 w-3 text-white/20 group-hover:text-amber-500" /></div>
                      </button>
                      {extranjero.especificaTramite && (
                      <button type="button" onClick={() => copyToClipboard(extranjero.especificaTramite)} className="w-full text-left p-1.5 rounded hover:bg-[#171717] border border-transparent hover:border-[#2a2a2a] transition-all group mt-1">
                        <p className="text-[10px] text-white/30">Especifica</p>
                        <div className="flex items-center justify-between"><p className="text-sm text-white">{extranjero.especificaTramite}</p><Copy className="h-3 w-3 text-white/20 group-hover:text-amber-500" /></div>
                      </button>
                      )}
                    </div>
                  )}

                  {/* Datos del extranjero */}
                  {(extranjero.nombre || extranjero.apellidos) && (
                    <div>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-brand-200 pb-1 mb-2">Datos del extranjero</p>
                      <div className="space-y-1">
                        {[
                          { label: 'CURP', value: extranjero.curpExtranjero },
                          { label: 'Nombre(s)', value: extranjero.nombre },
                          { label: 'Apellido(s)', value: extranjero.apellidos },
                          { label: 'Sexo', value: extranjero.sexo === 'H' ? 'Hombre' : extranjero.sexo === 'M' ? 'Mujer' : '' },
                          { label: 'Fecha nacimiento', value: formatDateDisplay(extranjero.fechaNacimiento) },
                          { label: 'Nacionalidad', value: extranjero.nacionalidad },
                          { label: 'Estado civil', value: extranjero.estadoCivil },
                        ].filter(item => item.value).map(item => (
                          <button key={item.label} type="button" onClick={() => copyToClipboard(item.value)} className="w-full text-left p-1.5 rounded hover:bg-[#171717] border border-transparent hover:border-[#2a2a2a] transition-all group">
                            <p className="text-[10px] text-white/30">{item.label}</p>
                            <div className="flex items-center justify-between"><p className="text-sm text-white">{item.value}</p><Copy className="h-3 w-3 text-white/20 group-hover:text-amber-500" /></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lugar de nacimiento */}
                  {(extranjero.paisNacimiento || extranjero.estadoProvinciaNacimiento) && (
                    <div>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-brand-200 pb-1 mb-2">Lugar de nacimiento</p>
                      <div className="space-y-1">
                        {[
                          { label: 'País', value: extranjero.paisNacimiento },
                          { label: 'Estado/Provincia', value: extranjero.estadoProvinciaNacimiento },
                        ].filter(item => item.value).map(item => (
                          <button key={item.label} type="button" onClick={() => copyToClipboard(item.value)} className="w-full text-left p-1.5 rounded hover:bg-[#171717] border border-transparent hover:border-[#2a2a2a] transition-all group">
                            <p className="text-[10px] text-white/30">{item.label}</p>
                            <div className="flex items-center justify-between"><p className="text-sm text-white">{item.value}</p><Copy className="h-3 w-3 text-white/20 group-hover:text-amber-500" /></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pasaporte */}
                  {(extranjero.documentoIdentificacion || extranjero.numeroDocumento) && (
                    <div>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-brand-200 pb-1 mb-2">Pasaporte / Documento</p>
                      <div className="space-y-1">
                        {[
                          { label: 'Documento', value: extranjero.documentoIdentificacion },
                          { label: 'Número', value: extranjero.numeroDocumento },
                          { label: 'País expedición', value: extranjero.paisExpedicion },
                          { label: 'Expedición', value: formatDateDisplay(extranjero.fechaExpedicion) },
                          { label: 'Vencimiento', value: formatDateDisplay(extranjero.fechaVencimiento) },
                        ].filter(item => item.value).map(item => (
                          <button key={item.label} type="button" onClick={() => copyToClipboard(item.value)} className="w-full text-left p-1.5 rounded hover:bg-[#171717] border border-transparent hover:border-[#2a2a2a] transition-all group">
                            <p className="text-[10px] text-white/30">{item.label}</p>
                            <div className="flex items-center justify-between"><p className="text-sm text-white">{item.value}</p><Copy className="h-3 w-3 text-white/20 group-hover:text-amber-500" /></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Domicilio en México */}
                  {extranjero.domCodigoPostal && (
                    <div>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-brand-200 pb-1 mb-2">Domicilio en México</p>
                      <div className="space-y-1">
                        {[
                          { label: 'Código postal', value: extranjero.domCodigoPostal },
                          { label: 'Estado', value: extranjero.domEstado },
                          { label: 'Municipio/Alcaldía', value: extranjero.domMunicipio },
                          { label: 'Colonia', value: extranjero.domColonia },
                          { label: 'Calle', value: extranjero.domCalle },
                          { label: 'Número exterior', value: extranjero.domNumeroExterior },
                          { label: 'Número interior', value: extranjero.domNumeroInterior },
                        ].filter(item => item.value).map(item => (
                          <button key={item.label} type="button" onClick={() => copyToClipboard(item.value)} className="w-full text-left p-1.5 rounded hover:bg-[#171717] border border-transparent hover:border-[#2a2a2a] transition-all group">
                            <p className="text-[10px] text-white/30">{item.label}</p>
                            <div className="flex items-center justify-between"><p className="text-sm text-white">{item.value}</p><Copy className="h-3 w-3 text-white/20 group-hover:text-amber-500" /></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Información adicional */}
                  {(extranjero.actividadPrincipal || extranjero.expulsadoMexico) && (
                    <div>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-brand-200 pb-1 mb-2">Información adicional</p>
                      <div className="space-y-1">
                        {[
                          { label: 'Actividad principal', value: extranjero.actividadPrincipal },
                          ...(extranjero.actividadPrincipal === 'Trabajar' ? [
                            { label: 'Sector trabajo', value: extranjero.sectorTrabajo },
                            { label: 'Situación trabajo', value: extranjero.situacionTrabajo },
                            { label: 'Ocupación', value: extranjero.ocupacionTrabajo },
                          ] : []),
                          { label: 'Expulsado de México', value: extranjero.expulsadoMexico },
                          { label: 'Antecedentes penales', value: extranjero.antecedentesPenales },
                        ].filter(item => item.value).map(item => (
                          <button key={item.label} type="button" onClick={() => copyToClipboard(item.value)} className="w-full text-left p-1.5 rounded hover:bg-[#171717] border border-transparent hover:border-[#2a2a2a] transition-all group">
                            <p className="text-[10px] text-white/30">{item.label}</p>
                            <div className="flex items-center justify-between"><p className="text-sm text-white">{item.value}</p><Copy className="h-3 w-3 text-white/20 group-hover:text-amber-500" /></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contacto */}
                  {(extranjero.telefono || extranjero.solicitanteEmail) && (
                    <div>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-brand-200 pb-1 mb-2">Correo electrónico</p>
                      <div className="space-y-1">
                        {[
                          { label: 'Teléfono', value: extranjero.telefono },
                          { label: 'Email', value: extranjero.solicitanteEmail },
                        ].filter(item => item.value).map(item => (
                          <button key={item.label} type="button" onClick={() => copyToClipboard(item.value)} className="w-full text-left p-1.5 rounded hover:bg-[#171717] border border-transparent hover:border-[#2a2a2a] transition-all group">
                            <p className="text-[10px] text-white/30">{item.label}</p>
                            <div className="flex items-center justify-between"><p className="text-sm text-white">{item.value}</p><Copy className="h-3 w-3 text-white/20 group-hover:text-amber-500" /></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Visas */}
                  {visas.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-brand-200 pb-1 mb-2">Visas del extranjero</p>
                      <div className="space-y-1">
                        {visas.map((v, i) => (
                          <button key={i} type="button" onClick={() => copyToClipboard(`${v.pais} - ${v.numero}`)} className="w-full text-left p-1.5 rounded hover:bg-[#171717] border border-transparent hover:border-[#2a2a2a] transition-all group">
                            <p className="text-[10px] text-white/30">Visa {i + 1}</p>
                            <div className="flex items-center justify-between"><p className="text-sm text-white">{v.pais} {v.numero && `- ${v.numero}`} {v.vencimiento && `(${formatDateDisplay(v.vencimiento)})`}</p><Copy className="h-3 w-3 text-white/20 group-hover:text-amber-500" /></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Solicitante */}
                  {solicitante.tipoPersona && (
                    <div>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-brand-200 pb-1 mb-2">Solicitante</p>
                      <div className="space-y-1">
                        {[
                          { label: 'Tipo persona', value: solicitante.tipoPersona },
                          ...(solicitante.tipoPersona === 'Física' ? [
                            { label: 'CURP', value: solicitante.curp },
                            { label: 'RFC', value: solicitante.rfc },
                            { label: 'Nombre(s)', value: solicitante.nombre },
                            { label: 'Apellido(s)', value: solicitante.apellidos },
                            { label: 'Nacionalidad', value: solicitante.nacionalidad },
                            { label: 'Documento', value: solicitante.tipoDocumento },
                            { label: 'Nº documento', value: solicitante.numeroDocumento },
                            { label: 'Vínculo/Parentesco', value: solicitante.vinculoParentesco },
                            { label: 'Código postal', value: solicitante.codigoPostal },
                            { label: 'Estado', value: solicitante.estado },
                            { label: 'Municipio', value: solicitante.municipio },
                            { label: 'Colonia', value: solicitante.colonia },
                            { label: 'Calle', value: solicitante.calle },
                            { label: 'Nº exterior', value: solicitante.numeroExterior },
                            { label: 'Nº interior', value: solicitante.numeroInterior },
                            { label: 'Lada', value: solicitante.lada },
                            { label: 'Teléfono fijo', value: solicitante.telefonoFijo },
                          ] : [
                            { label: 'RFC', value: solicitante.moralRfc },
                            { label: 'Razón social', value: solicitante.moralRazonSocial },
                            { label: 'Sector', value: solicitante.moralSector },
                            { label: 'Giro comercial', value: solicitante.moralGiroComercial },
                            { label: 'Código postal', value: solicitante.moralCodigoPostal },
                            { label: 'Estado', value: solicitante.moralEstado },
                            { label: 'Municipio', value: solicitante.moralMunicipio },
                            { label: 'Colonia', value: solicitante.moralColonia },
                            { label: 'Calle', value: solicitante.moralCalle },
                            { label: 'Nº exterior', value: solicitante.moralNumeroExterior },
                            { label: 'Nº interior', value: solicitante.moralNumeroInterior },
                            { label: 'Lada', value: solicitante.moralLada },
                            { label: 'Teléfono fijo', value: solicitante.moralTelefonoFijo },
                            { label: 'Nº acta constitutiva', value: solicitante.moralNumeroActa },
                            { label: 'Fecha acta', value: formatDateDisplay(solicitante.moralFechaActa) },
                          ]),
                        ].filter(item => item.value).map(item => (
                          <button key={item.label} type="button" onClick={() => copyToClipboard(item.value)} className="w-full text-left p-1.5 rounded hover:bg-[#171717] border border-transparent hover:border-[#2a2a2a] transition-all group">
                            <p className="text-[10px] text-white/30">{item.label}</p>
                            <div className="flex items-center justify-between"><p className="text-sm text-white">{item.value}</p><Copy className="h-3 w-3 text-white/20 group-hover:text-amber-500" /></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Personas autorizadas */}
                  {personasAutorizadas.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase border-b border-brand-200 pb-1 mb-2">Personas autorizadas</p>
                      <div className="space-y-1">
                        {personasAutorizadas.map((p, i) => (
                          <button key={i} type="button" onClick={() => copyToClipboard(`${p.nombre} ${p.apellidos}`)} className="w-full text-left p-1.5 rounded hover:bg-[#171717] border border-transparent hover:border-[#2a2a2a] transition-all group">
                            <p className="text-[10px] text-white/30">Persona {i + 1}</p>
                            <div className="flex items-center justify-between"><p className="text-sm text-white">{p.nombre} {p.apellidos} ({p.nacionalidad})</p><Copy className="h-3 w-3 text-white/20 group-hover:text-amber-500" /></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Iframe del INM (derecha) */}
              <div className="lg:col-span-2 border rounded-lg overflow-hidden">
                <iframe src={selectedTramite.urlSolicitud} className="w-full h-full" title="Formulario INM" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm text-white/40">
              <ExternalLink className="h-4 w-4" />
              <a href={selectedTramite.urlSolicitud} target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-400 font-medium">Abrir en nueva pestaña</a>
            </div>

            {/* Campos de pieza y clave debajo del iframe */}
            <div className="mt-6 pt-6 border-t">
              <div className="bg-amber-500/10 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800"><strong>Al finalizar la solicitud en el INM:</strong> Copia aquí el número de pieza y la clave que te muestra. Luego haz clic en &quot;Imprimir ahora&quot;, guarda el PDF en tu dispositivo y súbelo abajo.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div>
                  <label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Número de Pieza *</label>
                  <input type="text" value={numeroPieza} onChange={e => setNumeroPieza(e.target.value)} className="w-full px-3 py-2 border border-[#2a2a2a] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Ej: 0000011969016" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Clave *</label>
                  <input type="text" value={contrasenaINM} onChange={e => setContrasenaINM(e.target.value.toUpperCase())} className="w-full px-3 py-2 border border-[#2a2a2a] rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Ej: QFCSA" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">PDF Solicitud generada por el INM</label>
                  <label className="flex items-center gap-2 px-3 py-2 border border-[#2a2a2a] rounded-lg text-sm text-white/70 hover:bg-[#141414] cursor-pointer">
                    <Upload className="h-4 w-4" />{pdfFile ? pdfFile.name : 'Seleccionar PDF...'}
                    <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Requisitos */}
        {step === 3 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-white">Requisitos Documentales</h2>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">El extranjero deberá presentar los siguientes documentos. Puedes enviarle la lista por correo electrónico para que los prepare, o agendar una cita para la entrega presencial.</p>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <button type="button" onClick={async () => { try { await api.post('/notificaciones/enviar-requisitos', { email: extranjero.solicitanteEmail, nombreExtranjero: `${extranjero.nombre} ${extranjero.apellidos}`.trim(), requisitos: requisitos.map(r => r.nombre) }); toast.success(`Requisitos enviados a ${extranjero.solicitanteEmail}`); } catch { toast.success('Requisitos enviados (simulado)'); } }} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
                <FileText className="h-4 w-4" /> Enviar requisitos por correo
              </button>
              <button type="button" onClick={() => setShowCitaModal(true)} className="flex items-center gap-2 px-4 py-2.5 border border-[#2a2a2a] text-white/70 rounded-lg text-sm font-medium hover:bg-[#141414] transition-colors">
                <ClipboardList className="h-4 w-4" /> Agendar cita para entrega
              </button>
            </div>

            <p className="text-xs text-white/40 mb-4">Los documentos podrán ser cargados por el extranjero desde su perfil, o el gestor puede subirlos desde el detalle del trámite una vez creado.</p>

            <div className="space-y-3 max-w-2xl">
              {requisitos.map((req, i) => (
                <div key={i} className={`p-4 rounded-lg border ${req.obligatorio ? 'border-brand-200 bg-amber-500/10/50' : 'border-[#2a2a2a] bg-[#141414]'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium ${req.obligatorio ? 'bg-amber-500 text-white' : 'bg-gray-300 text-white'}`}>{i + 1}</div>
                    <div>
                      <p className="text-sm font-medium text-white">{req.nombre}{req.obligatorio ? <span className="ml-2 text-xs text-amber-500">(Obligatorio)</span> : <span className="ml-2 text-xs text-white/30">(Si aplica)</span>}</p>
                      <p className="text-xs text-white/40 mt-0.5">{req.descripcion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Pago (solo admin) */}
        {isAdmin && step === 4 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-bold text-white">Pago de Derechos</h2>
            </div>
            <p className="text-sm text-white/40 mb-6">Registra el pago de derechos del trámite migratorio</p>

            <div className="max-w-2xl space-y-5">
              {/* Concepto */}
              <div>
                <label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Concepto del pago *</label>
                <input type="text" value={pagoData.concepto || costo?.concepto || ''} onChange={e => setPagoData(prev => ({ ...prev, concepto: e.target.value }))} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" placeholder="Ej: Pago de derechos por visa" />
              </div>

              {/* Monto y Método */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Monto (MXN) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                    <input type="number" value={pagoData.monto} onChange={e => setPagoData(prev => ({ ...prev, monto: e.target.value }))} className="w-full pl-7 pr-3 py-2.5 border border-[#333333] bg-[#1a1a1a] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm hover:shadow transition-shadow" placeholder="0.00" min="0" step="0.01" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Método de pago *</label>
                  <select value={pagoData.metodoPago} onChange={e => setPagoData(prev => ({ ...prev, metodoPago: e.target.value }))} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]">
                    <option value="">Selecciona</option>
                    <option value="tarjeta_credito_debito">Tarjeta de crédito/débito</option>
                    <option value="transferencia_bancaria">Transferencia bancaria</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="hoja_ayuda">Hoja de ayuda bancaria</option>
                  </select>
                </div>
              </div>

              {/* Referencia */}
              <div>
                <label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Número de referencia / folio</label>
                <input type="text" value={pagoData.referencia} onChange={e => setPagoData(prev => ({ ...prev, referencia: e.target.value }))} className="w-full px-3 py-2.5 border border-[#2a2a2a] bg-[#171717]/80 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-amber-500 shadow-sm transition-all duration-300 hover:border-[#404040]" placeholder="Ej: REF-2025-001234" />
              </div>

              {/* Comprobante */}
              <div>
                <label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Comprobante de pago (PDF o imagen)</label>
                <div className="border-2 border-dashed border-[#333333] rounded-lg p-4 text-center hover:border-amber-500/50 transition-colors">
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setPagoData(prev => ({ ...prev, comprobante: e.target.files?.[0] || null }))} className="hidden" id="comprobante-pago" />
                  <label htmlFor="comprobante-pago" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-white/30 mx-auto mb-2" />
                    {pagoData.comprobante ? (
                      <p className="text-sm text-amber-500 font-medium">{pagoData.comprobante.name}</p>
                    ) : (
                      <p className="text-sm text-white/40">Click para subir comprobante</p>
                    )}
                  </label>
                </div>
              </div>

              {/* Info referencia del costo sugerido */}
              {costo && costo.monto > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-xs text-blue-800"><strong>Referencia:</strong> {costo.concepto} — ${costo.monto.toLocaleString('es-MX')} MXN</p>
                  <p className="text-[11px] text-blue-400 mt-1">{costo.fundamentoLegal}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation - ocultar en paso 0 */}
      {step > 0 && (
      <div className="flex items-center justify-between mt-6">
        <button type="button" onClick={handleBack} disabled={step === 0} className="flex items-center gap-2 px-4 py-2.5 border border-[#333333] text-white/60 rounded-lg text-sm font-medium hover:bg-[#1f1f1f] hover:border-[#404040] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"><ArrowLeft className="h-4 w-4" /> Anterior</button>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm font-semibold hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 transition-all duration-300 hover:shadow-amber-500/30 hover:scale-[1.02]">Siguiente <ArrowRight className="h-4 w-4" /></button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg text-sm font-semibold hover:from-emerald-400 hover:to-green-500 shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all duration-300"><Check className="h-4 w-4" /> {submitting ? 'Creando...' : 'Iniciar Trámite'}</button>
        )}
      </div>
      )}

      {/* Modal Agendar Cita */}
      {showCitaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#171717] rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-white mb-4">Agendar cita para entrega de documentos</h3>
            <div className="space-y-4">
              <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Fecha *</label><DatePicker value={citaData.fecha} onChange={v => setCitaData(prev => ({ ...prev, fecha: v }))} yearRange={[2025, 2027]} disablePast disableWeekends /></div>
              <div>
                <label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Hora *</label>
                <input type="time" value={citaData.horaInicio} onChange={e => setCitaData(prev => ({ ...prev, horaInicio: e.target.value }))} className="w-full px-3 py-2.5 border border-[#333333] bg-[#1a1a1a] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm" />
              </div>
              <div><label className="block text-xs font-semibold text-amber-200/70 mb-1 uppercase tracking-wide">Notas</label><textarea value={citaData.notas} onChange={e => setCitaData(prev => ({ ...prev, notas: e.target.value }))} rows={3} className="w-full px-3 py-2.5 border border-[#333333] bg-[#1a1a1a] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm resize-none" placeholder="Ej: Entrega de documentos originales en oficina" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowCitaModal(false)} className="px-4 py-2 border border-[#2a2a2a] text-white/70 rounded-lg text-sm font-medium hover:bg-[#141414]">Cancelar</button>
              <button type="button" onClick={async () => { if (!citaData.fecha || !citaData.horaInicio) { toast.error('Completa fecha y hora'); return; } try { await api.post('/citas', { clienteId: 'pendiente', asesorId: user?.id, fecha: citaData.fecha, hora: citaData.horaInicio, modalidad: 'presencial', notas: citaData.notas || `Entrega de documentos - ${extranjero.nombre} ${extranjero.apellidos}`, tipo: 'entrevista' }); toast.success('Cita agendada exitosamente'); setShowCitaModal(false); setCitaData({ fecha: '', horaInicio: '', horaFin: '', notas: '' }); } catch { toast.error('Error al agendar cita'); } }} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">Agendar cita</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
