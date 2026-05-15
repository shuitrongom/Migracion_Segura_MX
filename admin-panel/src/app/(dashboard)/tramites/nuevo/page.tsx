'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  ClipboardList,
  DollarSign,
  ExternalLink,
  Upload,
  Key,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { TipoTramite } from '@/lib/types';

// Los 11 trámites del INM
const TRAMITES_INM: {
  tipo: TipoTramite;
  nombre: string;
  descripcion: string;
  urlSolicitud: string;
}[] = [
  {
    tipo: TipoTramite.VISA,
    nombre: 'Visas solicitadas ante el INM',
    descripcion: 'Solicitud de visa por unidad familiar, trabajo, estudios u otros motivos',
    urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html',
  },
  {
    tipo: TipoTramite.RESIDENCIA_TEMPORAL,
    nombre: 'Residencia Temporal',
    descripcion: 'Para extranjeros que desean residir en México por un periodo de 1 a 4 años',
    urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html',
  },
  {
    tipo: TipoTramite.RESIDENCIA_PERMANENTE,
    nombre: 'Residencia Permanente',
    descripcion: 'Para extranjeros que desean residir indefinidamente en México',
    urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html',
  },
  {
    tipo: TipoTramite.REGULARIZACION,
    nombre: 'Regularización Migratoria',
    descripcion: 'Para extranjeros en situación migratoria irregular',
    urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html',
  },
  {
    tipo: TipoTramite.CAMBIO_CONDICION,
    nombre: 'Cambio de Condición de Estancia',
    descripcion: 'Para cambiar de una condición migratoria a otra',
    urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html',
  },
  {
    tipo: TipoTramite.NACIONALIDAD,
    nombre: 'Nacionalidad Mexicana',
    descripcion: 'Carta de naturalización o declaratoria de nacionalidad',
    urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html',
  },
  {
    tipo: TipoTramite.PERMISO_TRABAJO,
    nombre: 'Permiso de Trabajo',
    descripcion: 'Autorización para realizar actividades remuneradas',
    urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html',
  },
  {
    tipo: TipoTramite.RENOVACION,
    nombre: 'Renovación de Documento',
    descripcion: 'Renovar tarjeta de residente temporal o permanente',
    urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html',
  },
  {
    tipo: TipoTramite.CAMBIO_DOMICILIO,
    nombre: 'Cambio de Domicilio',
    descripcion: 'Notificar cambio de domicilio al INM',
    urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html',
  },
  {
    tipo: TipoTramite.REPOSICION_DOCUMENTO,
    nombre: 'Reposición de Documento',
    descripcion: 'Reponer documento migratorio por robo, extravío o deterioro',
    urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html',
  },
  {
    tipo: TipoTramite.CAMBIO_NACIONALIDAD,
    nombre: 'Cambio de Nacionalidad',
    descripcion: 'Notificar cambio de nacionalidad al INM',
    urlSolicitud: 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html',
  },
];

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

const STEPS = [
  'Tipo de Trámite',
  'Solicitud INM',
  'Pieza y Contraseña',
  'Requisitos',
  'Pago de Derechos',
];

export default function NuevoTramitePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedTramite, setSelectedTramite] = useState<(typeof TRAMITES_INM)[0] | null>(null);

  // Step 2: Pieza y contraseña
  const [numeroPieza, setNumeroPieza] = useState('');
  const [contrasenaINM, setContrasenaINM] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Step 3: Requisitos
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);

  // Step 4: Costo
  const [costo, setCosto] = useState<Costo | null>(null);

  // Cliente
  const [clienteId, setClienteId] = useState('');
  const [clientes, setClientes] = useState<{ id: string; nombreCompleto: string; email: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Cargar clientes
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await api.get('/clientes', { params: { limit: 100 } });
        const data = res.data?.data || res.data || [];
        setClientes(
          data.map((c: any) => ({
            id: c.id,
            nombreCompleto: c.nombreCompleto || `${c.nombre || ''} ${c.apellidos || ''}`.trim(),
            email: c.email,
          })),
        );
      } catch {
        /* ignore */
      }
    };
    fetchClientes();
  }, []);

  // Cargar requisitos y costo cuando se selecciona un trámite
  useEffect(() => {
    if (!selectedTramite) return;

    Promise.all([
      api.get(`/tramites/requisitos/${selectedTramite.tipo}`),
      api.get(`/tramites/costo/${selectedTramite.tipo}`),
    ])
      .then(([reqRes, costoRes]) => {
        setRequisitos(reqRes.data || []);
        setCosto(costoRes.data || null);
      })
      .catch(() => {
        toast.error('Error al cargar información del trámite');
      });
  }, [selectedTramite]);

  const handleSelectTramite = (tramite: (typeof TRAMITES_INM)[0]) => {
    setSelectedTramite(tramite);
  };

  const handleNext = () => {
    if (step === 0) {
      if (!selectedTramite) {
        toast.error('Selecciona un tipo de trámite');
        return;
      }
      if (!clienteId) {
        toast.error('Selecciona un cliente');
        return;
      }
    }
    if (step === 2) {
      if (!numeroPieza.trim()) {
        toast.error('Ingresa el número de pieza que generó el INM');
        return;
      }
      if (!contrasenaINM.trim()) {
        toast.error('Ingresa la contraseña que generó el INM');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!selectedTramite || !clienteId) return;

    setSubmitting(true);
    try {
      // Crear el trámite con la pieza y contraseña del INM
      const res = await api.post('/tramites', {
        tipo: selectedTramite.tipo,
        clienteId,
        datosFormulario: {
          numeroPiezaINM: numeroPieza,
          contrasenaINM: contrasenaINM,
        },
        esBorrador: false,
      });

      const tramiteId = res.data.id;

      // Subir PDF si se adjuntó
      if (pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        formData.append('nombre', `Solicitud INM - ${selectedTramite.nombre}`);
        formData.append('categoria', 'solicitud');
        formData.append('expedienteId', res.data.expedienteId || tramiteId);
        formData.append('tramiteId', tramiteId);

        try {
          await api.post('/documentos/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch {
          // No bloquear si falla la subida del PDF
          toast.error('El trámite se creó pero hubo un error al subir el PDF');
        }
      }

      toast.success('Trámite iniciado exitosamente');
      router.push(`/tramites/${tramiteId}`);
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
        <h1 className="text-2xl font-bold text-gray-900">Iniciar Trámite Migratorio</h1>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between overflow-x-auto">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
                  i < step
                    ? 'bg-green-500 text-white'
                    : i === step
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-xs hidden md:inline ${i === step ? 'font-medium text-gray-900' : 'text-gray-500'}`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="hidden md:block w-4 lg:w-8 h-px bg-gray-200 mx-1" />}
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
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombreCompleto} — {c.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de trámite grid */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Selecciona el trámite *</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {TRAMITES_INM.map((t) => (
                  <button
                    key={t.tipo}
                    type="button"
                    onClick={() => handleSelectTramite(t)}
                    className={`text-left p-4 rounded-lg border-2 transition-all ${
                      selectedTramite?.tipo === t.tipo
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${selectedTramite?.tipo === t.tipo ? 'text-brand-700' : 'text-gray-900'}`}
                    >
                      {t.nombre}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.descripcion}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Solicitud INM (iframe o link externo) */}
        {step === 1 && selectedTramite && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-brand-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Solicitud — {selectedTramite.nombre}
              </h2>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Instrucciones:</strong> Llena el formulario de solicitud en la página del INM.
                Al finalizar, el sistema te generará un <strong>número de pieza</strong> y una{' '}
                <strong>contraseña</strong>. Guárdalos para el siguiente paso.
              </p>
            </div>

            {/* Iframe con la página del INM */}
            <div className="border rounded-lg overflow-hidden mb-4" style={{ height: '600px' }}>
              <iframe
                src={selectedTramite.urlSolicitud}
                className="w-full h-full"
                title="Formulario de solicitud INM"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </div>

            {/* Link alternativo */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ExternalLink className="h-4 w-4" />
              <span>¿No carga el formulario?</span>
              <a
                href={selectedTramite.urlSolicitud}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:text-brand-700 font-medium"
              >
                Abrir en nueva pestaña
              </a>
            </div>
          </div>
        )}

        {/* Step 2: Capturar pieza y contraseña */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-5 w-5 text-brand-500" />
              <h2 className="text-lg font-semibold text-gray-900">Número de Pieza y Contraseña</h2>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Ingresa los datos que generó el INM al completar la solicitud. Estos se guardarán como
              respaldo del cliente.
            </p>

            <div className="max-w-md space-y-4">
              <div>
                <label htmlFor="numeroPieza" className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Pieza (NUT) *
                </label>
                <input
                  id="numeroPieza"
                  type="text"
                  value={numeroPieza}
                  onChange={(e) => setNumeroPieza(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Ej: INM/2026/..."
                />
              </div>

              <div>
                <label htmlFor="contrasenaINM" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña del INM *
                </label>
                <input
                  id="contrasenaINM"
                  type="text"
                  value={contrasenaINM}
                  onChange={(e) => setContrasenaINM(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Contraseña generada por el INM"
                />
              </div>

              <div>
                <label htmlFor="pdfSolicitud" className="block text-sm font-medium text-gray-700 mb-1">
                  PDF de la solicitud (opcional)
                </label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="pdfSolicitud"
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    {pdfFile ? pdfFile.name : 'Seleccionar archivo'}
                  </label>
                  <input
                    id="pdfSolicitud"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Sube el PDF que generó el INM para guardarlo en el expediente del cliente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Requisitos */}
        {step === 3 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="h-5 w-5 text-brand-500" />
              <h2 className="text-lg font-semibold text-gray-900">Requisitos Documentales</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              El cliente deberá presentar los siguientes documentos. Se enviarán por correo al
              cliente y podrá ir subiendo cada uno desde su perfil.
            </p>
            <div className="space-y-3 max-w-2xl">
              {requisitos.map((req, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${req.obligatorio ? 'border-brand-200 bg-brand-50/50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium ${
                        req.obligatorio ? 'bg-brand-500 text-white' : 'bg-gray-300 text-white'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {req.nombre}
                        {req.obligatorio && (
                          <span className="ml-2 text-xs text-brand-600 font-normal">(Obligatorio)</span>
                        )}
                        {!req.obligatorio && (
                          <span className="ml-2 text-xs text-gray-400 font-normal">(Si aplica)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{req.descripcion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Pago de derechos */}
        {step === 4 && (
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
                    {costo.monto === 0
                      ? 'Sin costo'
                      : `$${costo.monto.toLocaleString('es-MX')} ${costo.moneda}`}
                  </p>

                  <p className="text-sm text-gray-500 mb-1">Fundamento legal</p>
                  <p className="text-xs text-gray-600">{costo.fundamentoLegal}</p>
                </div>

                <p className="text-xs text-gray-400 mt-3">
                  * Los montos son aproximados y pueden variar. Consulte la Ley Federal de Derechos
                  vigente.
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
            <Check className="h-4 w-4" />
            {submitting ? 'Creando...' : 'Iniciar Trámite'}
          </button>
        )}
      </div>
    </div>
  );
}
