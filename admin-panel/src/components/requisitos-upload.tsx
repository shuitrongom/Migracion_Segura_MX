'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Upload, FileText, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Requisito {
  nombre: string;
  obligatorio: boolean;
  descripcion: string;
}

interface DocSubido {
  id: string;
  nombre: string;
  categoria?: string;
  estatus: string;
  createdAt: string;
}

interface RequisitosUploadProps {
  tramiteId: string;
  tipoTramite: string;
}

export default function RequisitosUpload({ tramiteId, tipoTramite }: RequisitosUploadProps) {
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [documentos, setDocumentos] = useState<DocSubido[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [reqRes, docsRes] = await Promise.all([
        api.get(`/tramites/requisitos/${tipoTramite}`),
        api.get(`/documentos/tramite/${tramiteId}`),
      ]);
      setRequisitos(reqRes.data || []);
      setDocumentos(docsRes.data?.data || docsRes.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [tramiteId, tipoTramite]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Check if a requisito has a matching uploaded document
  const getDocForRequisito = (reqNombre: string): DocSubido | undefined => {
    return documentos.find(d => 
      d.nombre.toLowerCase().includes(reqNombre.toLowerCase().slice(0, 20)) ||
      d.categoria?.toLowerCase().includes(reqNombre.toLowerCase().slice(0, 15))
    );
  };

  const handleUpload = async (reqNombre: string, file: File) => {
    setUploading(reqNombre);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('nombre', reqNombre);
      formData.append('categoria', 'requisito');
      formData.append('tramiteId', tramiteId);
      await api.post('/documentos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`"${reqNombre}" subido correctamente`);
      await fetchData(); // Refresh
    } catch {
      toast.error('Error al subir el documento');
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (requisitos.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-10 w-10 text-white/20 mx-auto mb-3" />
        <p className="text-sm text-white/30">No hay requisitos configurados para este trámite.</p>
      </div>
    );
  }

  const totalObligatorios = requisitos.filter(r => r.obligatorio).length;
  const subidosObligatorios = requisitos.filter(r => r.obligatorio && getDocForRequisito(r.nombre)).length;
  const progreso = totalObligatorios > 0 ? Math.round((subidosObligatorios / totalObligatorios) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Barra de progreso */}
      <div className="bg-gradient-to-r from-amber-500/10 to-green-50 border border-brand-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-white">Progreso de documentos</p>
          <p className="text-sm font-bold text-amber-500">{subidosObligatorios}/{totalObligatorios} obligatorios</p>
        </div>
        <div className="w-full h-3 bg-[#171717] rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-brand-500 to-green-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progreso}%` }}
          />
        </div>
        {progreso === 100 && (
          <p className="text-xs text-emerald-400 font-medium mt-2 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" /> Todos los documentos obligatorios han sido subidos
          </p>
        )}
      </div>

      {/* Lista de requisitos */}
      <div className="space-y-3">
        {requisitos.map((req, i) => {
          const docSubido = getDocForRequisito(req.nombre);
          const isUploading = uploading === req.nombre;

          return (
            <div
              key={i}
              className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                docSubido 
                  ? 'border-green-300 bg-emerald-500/10/50' 
                  : req.obligatorio 
                    ? 'border-amber-200 bg-amber-500/10/30' 
                    : 'border-[#2a2a2a] bg-[#171717]'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Indicador de estado */}
                <div className={`flex-shrink-0 mt-0.5 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                  docSubido 
                    ? 'bg-green-500 shadow-md shadow-green-200 scale-110' 
                    : req.obligatorio 
                      ? 'bg-amber-100 border-2 border-amber-300' 
                      : 'bg-[#1f1f1f] border-2 border-[#2a2a2a]'
                }`}>
                  {docSubido ? (
                    <CheckCircle className="h-5 w-5 text-white animate-in zoom-in duration-300" />
                  ) : (
                    <span className={`text-xs font-bold ${req.obligatorio ? 'text-amber-600' : 'text-white/30'}`}>{i + 1}</span>
                  )}
                </div>

                {/* Info del requisito */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">{req.nombre}</p>
                    {req.obligatorio && !docSubido && (
                      <span className="inline-flex px-1.5 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 rounded">OBLIGATORIO</span>
                    )}
                    {docSubido && (
                      <span className="inline-flex px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 bg-green-100 rounded">SUBIDO</span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{req.descripcion}</p>

                  {/* Documento subido info */}
                  {docSubido && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="font-medium">{docSubido.nombre}</span>
                    </div>
                  )}
                </div>

                {/* Botón de subir */}
                <div className="flex-shrink-0">
                  {isUploading ? (
                    <div className="h-9 w-9 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                    </div>
                  ) : (
                    <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                      docSubido 
                        ? 'text-emerald-400 bg-green-100 hover:bg-green-200' 
                        : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/10 shadow-sm'
                    }`}>
                      <Upload className="h-3.5 w-3.5" />
                      {docSubido ? 'Resubir' : 'Subir'}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(req.nombre, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
