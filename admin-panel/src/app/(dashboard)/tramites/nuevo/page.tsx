'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, FileText, ClipboardList, DollarSign, ExternalLink, Upload, Key, Copy } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { TipoTramite } from '@/lib/types';
import { PROPOSITOS_VIAJE, SEXOS, ESTADOS_CIVILES, DOCUMENTOS_IDENTIFICACION, NACIONALIDADES, PAISES, ACTIVIDADES_PRINCIPALES, SI_NO, TIPOS_PERSONA } from '@/lib/catalogos-inm';

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
    domicilioMexico: '', telefono: '', email: '',
    tiempoEstancia: '', visasActuales: '', comentarios: '',
    // Datos del solicitante/promovente
    solicitanteTipoPersona: '', solicitanteNombre: '', solicitanteParentesco: '', 
    solicitanteEmail: '', solicitanteEmailConfirmacion: '',
    personaAutorizada: '',
  });

  // Visas del extranjero (array dinámico)
  const [visas, setVisas] = useState<{ pais: string; numero: string; vencimiento: string }[]>([]);
  const [visaTemp, setVisaTemp] = useState({ pais: '', numero: '', vencimiento: '' });

  // Pieza y contraseña
  const [numeroPieza, setNumeroPieza] = useState('');
  const [contrasenaINM, setContrasenaINM] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

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
    setExtranjero(prev => ({ ...prev, [field]: value }));
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

  const handleNext = () => {
    if (step === 0 && !selectedTramite) { toast.error('Selecciona un tipo de trámite'); return; }
    if (step === 1) {
      if (!extranjero.nombre.trim()) { toast.error('Ingresa el nombre del extranjero'); return; }
      if (!extranjero.apellidos.trim()) { toast.error('Ingresa los apellidos'); return; }
      if (!extranjero.email.trim()) { toast.error('Ingresa el email'); return; }
      if (!extranjero.telefono.trim()) { toast.error('Ingresa el teléfono'); return; }
      if (extranjero.solicitanteEmail && extranjero.solicitanteEmail !== extranjero.solicitanteEmailConfirmacion) {
        toast.error('Los correos electrónicos del promovente no coinciden'); return;
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
        email: extranjero.email,
        telefono: extranjero.telefono,
      });
      const clienteId = clienteRes.data.id;

      const tramiteRes = await api.post('/tramites', {
        tipo: selectedTramite.tipo,
        clienteId,
        datosFormulario: { ...extranjero, visas, numeroPiezaINM: numeroPieza, contrasenaINM },
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
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Propósito de viaje *</label><select value={extranjero.propositoViaje} onChange={e => updateExtranjero('propositoViaje', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{PROPOSITOS_VIAJE.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Tiempo de estancia</label><input type="text" value={extranjero.tiempoEstancia} onChange={e => updateExtranjero('tiempoEstancia', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Ej: 1 año" /></div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">Datos del extranjero (conforme a pasaporte o documento de identidad)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Nombre(s) *</label><input type="text" value={extranjero.nombre} onChange={e => updateExtranjero('nombre', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Apellido(s) *</label><input type="text" value={extranjero.apellidos} onChange={e => updateExtranjero('apellidos', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Sexo *</label><select value={extranjero.sexo} onChange={e => updateExtranjero('sexo', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{SEXOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Fecha de nacimiento *</label><input type="date" value={extranjero.fechaNacimiento} onChange={e => updateExtranjero('fechaNacimiento', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Nacionalidad actual *</label><select value={extranjero.nacionalidad} onChange={e => updateExtranjero('nacionalidad', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{NACIONALIDADES.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Estado civil actual</label><select value={extranjero.estadoCivil} onChange={e => updateExtranjero('estadoCivil', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{ESTADOS_CIVILES.map(ec => <option key={ec.value} value={ec.value}>{ec.label}</option>)}</select></div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">Lugar de nacimiento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">País de nacimiento *</label><select value={extranjero.paisNacimiento} onChange={e => updateExtranjero('paisNacimiento', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{PAISES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Estado, provincia o departamento *</label><input type="text" value={extranjero.estadoProvinciaNacimiento} onChange={e => updateExtranjero('estadoProvinciaNacimiento', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">Pasaporte o documento con el que se identifica el extranjero</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Documento de identificación *</label><select value={extranjero.documentoIdentificacion} onChange={e => updateExtranjero('documentoIdentificacion', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{DOCUMENTOS_IDENTIFICACION.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Número de documento *</label><input type="text" value={extranjero.numeroDocumento} onChange={e => updateExtranjero('numeroDocumento', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">País de expedición *</label><select value={extranjero.paisExpedicion} onChange={e => updateExtranjero('paisExpedicion', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{PAISES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Fecha de expedición</label><input type="date" value={extranjero.fechaExpedicion} onChange={e => updateExtranjero('fechaExpedicion', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Fecha de vencimiento</label><input type="date" value={extranjero.fechaVencimiento} onChange={e => updateExtranjero('fechaVencimiento', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">Información adicional del extranjero</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Actividad principal en tu país de residencia *</label><select value={extranjero.actividadPrincipal} onChange={e => updateExtranjero('actividadPrincipal', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{ACTIVIDADES_PRINCIPALES.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">¿Has sido expulsado de México? *</label><select value={extranjero.expulsadoMexico} onChange={e => updateExtranjero('expulsadoMexico', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{SI_NO.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">¿Tienes antecedentes penales? *</label><select value={extranjero.antecedentesPenales} onChange={e => updateExtranjero('antecedentesPenales', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{SI_NO.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Domicilio en México</label><input type="text" value={extranjero.domicilioMexico} onChange={e => updateExtranjero('domicilioMexico', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Teléfono *</label><input type="tel" value={extranjero.telefono} onChange={e => updateExtranjero('telefono', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="+52 55 1234 5678" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Email *</label><input type="email" value={extranjero.email} onChange={e => updateExtranjero('email', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                <div className="md:col-span-3"><label className="block text-xs font-medium text-gray-600 mb-1">Visas con las que cuenta el extranjero</label><input type="text" value={extranjero.visasActuales} onChange={e => updateExtranjero('visasActuales', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Ej: Visa americana B1/B2 vigente" /></div>
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
                  <div className="flex-1"><label className="block text-xs font-medium text-gray-600 mb-1">Fecha de vencimiento</label><input type="date" value={visaTemp.vencimiento} onChange={e => setVisaTemp(prev => ({ ...prev, vencimiento: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                  <button type="button" onClick={handleAddVisa} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">Agregar visa</button>
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
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">Datos del solicitante que tiene el vínculo familiar con el extranjero</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Tipo de persona *</label><select value={extranjero.solicitanteTipoPersona} onChange={e => updateExtranjero('solicitanteTipoPersona', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="">Selecciona</option>{TIPOS_PERSONA.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Nombre del solicitante</label><input type="text" value={extranjero.solicitanteNombre} onChange={e => updateExtranjero('solicitanteNombre', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Parentesco con el extranjero</label><input type="text" value={extranjero.solicitanteParentesco} onChange={e => updateExtranjero('solicitanteParentesco', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Ej: Cónyuge, Hijo, Empleador" /></div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">Correo electrónico para notificar al promovente</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800 text-center">Agrega la dirección de correo electrónico en donde se recibirán las notificaciones asociadas a tu trámite.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Correo electrónico *</label><input type="email" value={extranjero.solicitanteEmail} onChange={e => updateExtranjero('solicitanteEmail', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="nombre@correo.com" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Correo electrónico (confirmación) *</label><input type="email" value={extranjero.solicitanteEmailConfirmacion} onChange={e => updateExtranjero('solicitanteEmailConfirmacion', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="nombre@correo.com" /></div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">En su caso, persona autorizada para tramitar, oír o recibir notificaciones</h3>
              <div className="max-w-4xl">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Nombre de persona autorizada</label><input type="text" value={extranjero.personaAutorizada} onChange={e => updateExtranjero('personaAutorizada', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">Comentarios</h3>
              <textarea value={extranjero.comentarios} onChange={e => updateExtranjero('comentarios', e.target.value)} rows={3} className="w-full max-w-4xl px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" placeholder="Observaciones adicionales..." />
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
                    { label: 'Sexo', value: extranjero.sexo === 'M' ? 'Masculino' : extranjero.sexo === 'F' ? 'Femenino' : '' },
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
                    { label: 'Domicilio México', value: extranjero.domicilioMexico },
                    { label: 'Teléfono', value: extranjero.telefono },
                    { label: 'Email', value: extranjero.email },
                    { label: 'Propósito viaje', value: extranjero.propositoViaje },
                    { label: 'Actividad principal', value: extranjero.actividadPrincipal },
                    { label: 'Expulsado de México', value: extranjero.expulsadoMexico },
                    { label: 'Antecedentes penales', value: extranjero.antecedentesPenales },
                    { label: 'Visas actuales', value: extranjero.visasActuales },
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
                {extranjero.solicitanteNombre && (
                  <>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mt-4 mb-3">Solicitante</h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Nombre', value: extranjero.solicitanteNombre },
                        { label: 'Parentesco', value: extranjero.solicitanteParentesco },
                        { label: 'Email', value: extranjero.solicitanteEmail },
                        { label: 'Persona autorizada', value: extranjero.personaAutorizada },
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
