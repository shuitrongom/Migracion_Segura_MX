'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, FileText, ClipboardList, ExternalLink, Upload, Key, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Requisito { nombre: string; obligatorio: boolean; descripcion: string; }

const STEPS = ['Solicitud INM', 'Requisitos'];

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

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(`/tramites/${tramiteId}`);
        setTramite(res.data);
        // Cargar requisitos del tipo de trámite
        const reqRes = await api.get(`/tramites/requisitos/${res.data.tipo}`);
        setRequisitos(reqRes.data || []);
      } catch {
        toast.error('Error al cargar el trámite');
      } finally {
        setLoading(false);
      }
    }
    if (tramiteId) fetchData();
  }, [tramiteId]);

  const handleNext = () => {
    if (step === 0) {
      if (!numeroPieza.trim()) { toast.error('Ingresa el número de pieza'); return; }
      if (!contrasenaINM.trim()) { toast.error('Ingresa la clave del INM'); return; }
      if (!pdfFile) { toast.error('Sube el PDF de la solicitud'); return; }
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      // Actualizar el trámite con la pieza y contraseña
      await api.put(`/tramites/${tramiteId}/borrador`, {
        datosFormulario: {
          ...tramite?.datosFormulario,
          numeroPiezaINM: numeroPieza,
          contrasenaINM: contrasenaINM,
        },
      });

      // Actualizar estatus a en_revision
      await api.patch(`/tramites/${tramiteId}/estatus`, { estatus: 'en_revision' });

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

      toast.success('Trámite completado. Requisitos enviados al extranjero.');
      router.push(`/tramites/${tramiteId}`);
    } catch {
      toast.error('Error al completar el trámite');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>;
  }

  const urlSolicitud = 'https://www.inm.gob.mx/tramites/publico/solicitud_internacion.html';

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/tramites/${tramiteId}`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Continuar Trámite</h1>
          <p className="text-sm text-gray-500">Extranjero: {tramite?.cliente?.nombreCompleto || tramite?.datosFormulario?.nombre || '—'}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
        <div className="flex items-center justify-center gap-4">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm ${i === step ? 'font-medium text-gray-900' : 'text-gray-500'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className="w-12 h-px bg-gray-200 mx-2" />}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        {/* Step 0: Solicitud INM */}
        {step === 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-brand-500" />
              <h2 className="text-lg font-semibold text-gray-900">Llenar Solicitud en el INM</h2>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">Llena el formulario del INM con los datos del extranjero. Al finalizar, copia la pieza y clave abajo.</p>
            </div>

            {/* Datos del extranjero como referencia */}
            {tramite?.datosFormulario && (
              <div className="mb-4 p-4 bg-gray-50 border rounded-lg">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Datos del extranjero (referencia)</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-400">Nombre:</span> <span className="text-gray-900">{tramite.datosFormulario.nombre} {tramite.datosFormulario.apellidos}</span></div>
                  <div><span className="text-gray-400">Nacionalidad:</span> <span className="text-gray-900">{tramite.datosFormulario.nacionalidad}</span></div>
                  <div><span className="text-gray-400">Pasaporte:</span> <span className="text-gray-900">{tramite.datosFormulario.pasaporteNumero}</span></div>
                  <div><span className="text-gray-400">Email:</span> <span className="text-gray-900">{tramite.datosFormulario.email}</span></div>
                </div>
              </div>
            )}

            {/* Iframe */}
            <div className="border rounded-lg overflow-hidden mb-4" style={{ height: '500px' }}>
              <iframe src={urlSolicitud} className="w-full h-full" title="Formulario INM" />
            </div>
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
              <ExternalLink className="h-4 w-4" />
              <a href={urlSolicitud} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 font-medium">Abrir en nueva pestaña</a>
            </div>

            {/* Campos pieza y clave */}
            <div className="border-t pt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800"><strong>Al finalizar:</strong> Copia aquí el número de pieza y la clave. Luego sube el PDF.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Número de Pieza *</label>
                  <input type="text" value={numeroPieza} onChange={e => setNumeroPieza(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="0000011969016" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Clave *</label>
                  <input type="text" value={contrasenaINM} onChange={e => setContrasenaINM(e.target.value.toUpperCase())} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="QFCSA" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PDF Solicitud *</label>
                  <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
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
              <ClipboardList className="h-5 w-5 text-brand-500" />
              <h2 className="text-lg font-semibold text-gray-900">Requisitos Documentales</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Al finalizar se enviarán los requisitos por correo al extranjero.</p>
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
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button type="button" onClick={() => step > 0 ? setStep(s => s - 1) : router.push(`/tramites/${tramiteId}`)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" /> {step === 0 ? 'Cancelar' : 'Anterior'}
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">
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
