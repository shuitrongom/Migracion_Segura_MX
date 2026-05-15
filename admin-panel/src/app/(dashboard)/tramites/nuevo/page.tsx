'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, FileText, ClipboardList, DollarSign, Send } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { TipoTramite } from '@/lib/types';

const TRAMITES_INFO: { tipo: TipoTramite; nombre: string; descripcion: string }[] = [
  { tipo: TipoTramite.RESIDENCIA_TEMPORAL, nombre: 'Residencia Temporal', descripcion: 'Para extranjeros que desean residir en México por un periodo determinado (1-4 años)' },
  { tipo: TipoTramite.RESIDENCIA_PERMANENTE, nombre: 'Residencia Permanente', descripcion: 'Para extranjeros que desean residir indefinidamente en México' },
  { tipo: TipoTramite.REGULARIZACION, nombre: 'Regularización Migratoria', descripcion: 'Para extranjeros en situación migratoria irregular' },
  { tipo: TipoTramite.CAMBIO_CONDICION, nombre: 'Cambio de Condición de Estancia', descripcion: 'Para cambiar de una condición migratoria a otra' },
  { tipo: TipoTramite.VISA, nombre: 'Visa por Unidad Familiar', descripcion: 'Para solicitar visa para un familiar extranjero' },
  { tipo: TipoTramite.NACIONALIDAD, nombre: 'Nacionalidad Mexicana', descripcion: 'Carta de naturalización o declaratoria de nacionalidad' },
  { tipo: TipoTramite.PERMISO_TRABAJO, nombre: 'Permiso de Trabajo', descripcion: 'Autorización para realizar actividades remuneradas' },
  { tipo: TipoTramite.RENOVACION, nombre: 'Renovación de Documento', descripcion: 'Renovar tarjeta de residente temporal o permanente' },
  { tipo: TipoTramite.CAMBIO_DOMICILIO, nombre: 'Cambio de Domicilio', descripcion: 'Notificar cambio de domicilio al INM' },
  { tipo: TipoTramite.REPOSICION_DOCUMENTO, nombre: 'Reposición de Documento', descripcion: 'Reponer documento migratorio por robo, extravío o deterioro' },
  { tipo: TipoTramite.CAMBIO_NACIONALIDAD, nombre: 'Cambio de Nacionalidad', descripcion: 'Notificar cambio de nacionalidad al INM' },
];

interface FormField {
  nombre: string;
  tipo: string;
  requerido: boolean;
  opciones?: string[];
  label?: string;
}

interface Requisito {
  nombre: string;
  obligatorio: boolean;
  descripcion: string;
}

interface Costo {
  concepto: string;
  monto: number;
  moneda: string;
  fundamentoLegal: string;
}

const STEPS = ['Tipo de Trámite', 'Solicitud', 'Requisitos', 'Pago de Derechos'];

export default function NuevoTramitePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedTipo, setSelectedTipo] = useState<TipoTramite | null>(null);
  const [clienteId, setClienteId] = useState('');
  const [clientes, setClientes] = useState<{ id: string; nombreCompleto: string; email: string }[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [costo, setCosto] = useState<Costo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);

  // Cargar clientes para el select
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await api.get('/clientes', { params: { limit: 100 } });
        const data = res.data?.data || res.data || [];
        setClientes(data.map((c: any) => ({ id: c.id, nombreCompleto: c.nombreCompleto || `${c.nombre} ${c.apellidos}`, email: c.email })));
      } catch { /* ignore */ }
    };
    fetchClientes();
  }, []);

  // Cargar formulario, requisitos y costo cuando se selecciona un tipo
  useEffect(() => {
    if (!selectedTipo) return;
    setLoadingForm(true);

    Promise.all([
      api.get(`/tramites/formulario/${selectedTipo}`),
      api.get(`/tramites/requisitos/${selectedTipo}`),
      api.get(`/tramites/costo/${selectedTipo}`),
    ]).then(([formRes, reqRes, costoRes]) => {
      setFormFields(formRes.data.campos || []);
      setRequisitos(reqRes.data || []);
      setCosto(costoRes.data || null);
    }).catch(() => {
      toast.error('Error al cargar información del trámite');
    }).finally(() => {
      setLoadingForm(false);
    });
  }, [selectedTipo]);

  const handleSelectTipo = (tipo: TipoTramite) => {
    setSelectedTipo(tipo);
    setFormData({});
  };

  const handleNext = () => {
    if (step === 0 && !selectedTipo) {
      toast.error('Selecciona un tipo de trámite');
      return;
    }
    if (step === 0 && !clienteId) {
      toast.error('Selecciona un cliente');
      return;
    }
    if (step === 1) {
      // Validar campos requeridos
      const missing = formFields.filter(f => f.requerido && !formData[f.nombre]?.trim());
      if (missing.length > 0) {
        toast.error(`Completa los campos requeridos: ${missing.map(f => f.label || f.nombre).join(', ')}`);
        return;
      }
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!selectedTipo || !clienteId) return;

    setSubmitting(true);
    try {
      await api.post('/tramites', {
        tipo: selectedTipo,
        clienteId,
        datosFormulario: formData,
        esBorrador: false,
      });
      toast.success('Trámite creado exitosamente');
      router.push('/tramites');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al crear trámite';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/tramites" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Trámite Migratorio</h1>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:inline ${i === step ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="hidden sm:block w-8 lg:w-16 h-px bg-gray-200 mx-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        {/* Step 0: Seleccionar tipo */}
        {step === 0 && (
          <div className="space-y-6">
            {/* Cliente select */}
            <div>
              <label htmlFor="clienteId" className="block text-sm font-medium text-gray-700 mb-1.5">
                Cliente *
              </label>
              <select
                id="clienteId"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Seleccionar cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombreCompleto} — {c.email}</option>
                ))}
              </select>
            </div>

            {/* Tipo de trámite grid */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Selecciona el tipo de trámite *</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {TRAMITES_INFO.map(t => (
                  <button
                    key={t.tipo}
                    type="button"
                    onClick={() => handleSelectTipo(t.tipo)}
                    className={`text-left p-4 rounded-lg border-2 transition-all ${
                      selectedTipo === t.tipo
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <p className={`text-sm font-medium ${selectedTipo === t.tipo ? 'text-brand-700' : 'text-gray-900'}`}>
                      {t.nombre}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.descripcion}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Solicitud (formulario dinámico) */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-brand-500" />
              <h2 className="text-lg font-semibold text-gray-900">Solicitud — {TRAMITES_INFO.find(t => t.tipo === selectedTipo)?.nombre}</h2>
            </div>
            {loadingForm ? (
              <p className="text-gray-400">Cargando formulario...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                {formFields.map(field => (
                  <div key={field.nombre} className={field.tipo === 'select' && (field.opciones?.length || 0) > 10 ? 'md:col-span-2' : ''}>
                    <label htmlFor={field.nombre} className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label || field.nombre} {field.requerido && '*'}
                    </label>
                    {field.tipo === 'select' ? (
                      <select
                        id={field.nombre}
                        value={formData[field.nombre] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.nombre]: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Seleccionar...</option>
                        {field.opciones?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={field.nombre}
                        type={field.tipo === 'number' ? 'number' : field.tipo === 'date' ? 'date' : 'text'}
                        value={formData[field.nombre] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.nombre]: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Requisitos */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="h-5 w-5 text-brand-500" />
              <h2 className="text-lg font-semibold text-gray-900">Requisitos Documentales</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              El cliente deberá presentar los siguientes documentos. Se enviarán por correo al cliente al crear el trámite.
            </p>
            <div className="space-y-3 max-w-2xl">
              {requisitos.map((req, i) => (
                <div key={i} className={`p-4 rounded-lg border ${req.obligatorio ? 'border-brand-200 bg-brand-50/50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium ${
                      req.obligatorio ? 'bg-brand-500 text-white' : 'bg-gray-300 text-white'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {req.nombre}
                        {req.obligatorio && <span className="ml-2 text-xs text-brand-600 font-normal">(Obligatorio)</span>}
                        {!req.obligatorio && <span className="ml-2 text-xs text-gray-400 font-normal">(Si aplica)</span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{req.descripcion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Pago de derechos */}
        {step === 3 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-brand-500" />
              <h2 className="text-lg font-semibold text-gray-900">Pago de Derechos</h2>
            </div>
            {costo && (
              <div className="max-w-md">
                <div className="p-6 rounded-lg border border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-500 mb-1">Concepto</p>
                  <p className="text-base font-medium text-gray-900 mb-4">{costo.concepto}</p>

                  <p className="text-sm text-gray-500 mb-1">Monto</p>
                  <p className="text-3xl font-bold text-gray-900 mb-4">
                    {costo.monto === 0 ? 'Sin costo' : `$${costo.monto.toLocaleString('es-MX')} ${costo.moneda}`}
                  </p>

                  <p className="text-sm text-gray-500 mb-1">Fundamento legal</p>
                  <p className="text-xs text-gray-600">{costo.fundamentoLegal}</p>
                </div>

                <p className="text-xs text-gray-400 mt-3">
                  * Los montos son aproximados y pueden variar. Consulte la Ley Federal de Derechos vigente.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
          >
            Siguiente
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Creando...' : 'Crear Trámite'}
          </button>
        )}
      </div>
    </div>
  );
}
