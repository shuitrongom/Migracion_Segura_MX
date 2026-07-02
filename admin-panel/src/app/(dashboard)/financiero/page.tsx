'use client';

import { useState } from 'react';
import { DollarSign, Clock, CheckCircle, XCircle, RefreshCw, Wallet, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

const ESTATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  en_revision_voucher: { label: 'Voucher en revisión', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: Clock },
  aprobado: { label: 'Pagado', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  rechazado: { label: 'Rechazado', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
  cancelado: { label: 'Cancelado', color: 'bg-[#1a1a1a] text-white/70 border-[#3a3a3a]', icon: XCircle },
};

const TIPO_PAGO_LABELS: Record<string, string> = {
  anticipo: 'Parcialidad',
  liquidacion: 'Parcialidad',
  pago_unico: 'Pago único',
};

export default function FinancieroPage() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());

  const reporteQuery = useQuery({
    queryKey: ['financiero', 'reporte', mes, anio],
    queryFn: async () => {
      const res = await api.get(`/financiero/reporte-mensual?mes=${mes}&anio=${anio}`);
      return res.data;
    },
  });

  const pagosQuery = useQuery({
    queryKey: ['financiero', 'pagos-all'],
    queryFn: async () => {
      const allPagos: any[] = [];

      // Pagos de trámites
      const tramitesRes = await api.get('/tramites?page=1&limit=100');
      const tramites = tramitesRes.data?.data || [];
      for (const t of tramites) {
        try {
          const pagosRes = await api.get(`/financiero/pagos/tramite/${t.id}`);
          const pagos = Array.isArray(pagosRes.data) ? pagosRes.data : [];
          pagos.forEach((p: any) => allPagos.push({ ...p, tramite: t, origen: 'tramite' }));
        } catch {}
      }

      // Pagos de solicitudes
      try {
        const solRes = await api.get('/solicitudes?page=1&limit=100');
        const solicitudes = solRes.data?.data || solRes.data || [];
        for (const sol of solicitudes) {
          if (sol.mercadopagoPreferenceId || sol.costo) {
            allPagos.push({
              id: sol.id + '-sol',
              monto: sol.costo || 100,
              concepto: `Solicitud INM - ${(sol.tipoTramite || '').replace(/_/g, ' ')}`,
              estatusPago: sol.estatus === 'pagada' ? 'aprobado' : sol.estatus === 'cancelada' ? 'cancelado' : 'pendiente',
              tipoPago: 'pago_unico',
              createdAt: sol.createdAt,
              tramiteId: sol.id,
              origen: 'solicitud',
              solicitud: sol,
              tramite: {
                numeroPieza: sol.numeroPieza,
                datosFormulario: sol.datosFormulario,
              },
            });
          }
        }
      } catch {}

      return allPagos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    staleTime: 30000,
  });

  const pagos = pagosQuery.data || [];
  const totalAprobado = pagos.filter(p => p.estatusPago === 'aprobado').reduce((sum, p) => sum + Number(p.monto), 0);
  const totalPendiente = pagos.filter(p => p.estatusPago === 'pendiente').reduce((sum, p) => sum + Number(p.monto), 0);
  const totalEnRevision = pagos.filter(p => p.estatusPago === 'en_revision_voucher').reduce((sum, p) => sum + Number(p.monto), 0);
  const totalCancelado = pagos.filter(p => p.estatusPago === 'cancelado').reduce((sum, p) => sum + Number(p.monto), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-neutral-900 via-stone-800 to-amber-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">Módulo Financiero</h1>
          <p className="text-amber-200 mt-1">Control detallado de pagos, ingresos y adeudos</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/70">Total Cobrado</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/30">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalAprobado)}</p>
            <p className="text-xs text-emerald-400 mt-1">{pagos.filter(p => p.estatusPago === 'aprobado').length} confirmados</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500 to-amber-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/70">Pendiente</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-200/30">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalPendiente)}</p>
            <p className="text-xs text-yellow-600 mt-1">{pagos.filter(p => p.estatusPago === 'pendiente').length} por cobrar</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/70">Cancelado</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-200/30">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalCancelado)}</p>
            <p className="text-xs text-red-400 mt-1">{pagos.filter(p => p.estatusPago === 'cancelado').length} cancelados</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500 to-amber-600 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/70">Total Generado</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20/30">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalAprobado + totalPendiente)}</p>
            <p className="text-xs text-amber-500 mt-1">{pagos.length} pagos totales</p>
          </div>
        </div>
      </div>

      {/* Tabla de pagos */}
      <div className="dark-card-static overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10"><DollarSign className="h-4 w-4 text-amber-500" /></div>
            <h2 className="text-lg font-bold text-white">Registro de Pagos</h2>
          </div>
          <button onClick={() => pagosQuery.refetch()} className="p-2.5 rounded-xl hover:bg-[#222222] text-white/70 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {pagosQuery.isLoading ? (
          <div className="p-6 space-y-4">{[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-[#1a1a1a]">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}</div>
        ) : pagos.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/15 to-amber-600/15 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-amber-400/70" />
            </div>
            <p className="text-white/70 font-medium">No hay pagos registrados</p>
            <p className="text-xs text-white/70 mt-1">Los pagos aparecerán aquí cuando se generen desde Continuar Trámite</p>
          </div>
        ) : (
          <div className="divide-y divide-[#262626]">
            {pagos.map((pago: any) => {
              const config = ESTATUS_CONFIG[pago.estatusPago] || ESTATUS_CONFIG.pendiente;
              const Icon = config.icon;
              return (
                <div key={pago.id} className="px-6 py-4 hover:bg-[#222222] transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-600/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                        <DollarSign className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{pago.tramite?.cliente?.nombreCompleto || pago.tramite?.datosFormulario?.nombre || pago.solicitud?.datosFormulario?.nombre || '—'}</p>
                        <p className="text-xs text-white/70">{pago.concepto} • {pago.createdAt?.slice(0, 10)}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-white/70">{pago.tramite?.numeroPieza || pago.tramiteId?.slice(0, 8)}</p>
                          {pago.origen === 'solicitud' && <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded">Solicitud $100</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        {TIPO_PAGO_LABELS[pago.tipoPago] || pago.tipoPago}
                      </span>
                      <p className="font-mono font-bold text-white">{formatCurrency(Number(pago.monto))}</p>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${config.color}`}>
                        <Icon className="h-3 w-3" /> {config.label}
                      </span>
                      {/* Botón confirmar pago manual — visible en cualquier pago pendiente */}
                      {(pago.estatusPago === 'pendiente' || pago.estatusPago === 'en_revision_voucher') && (
                        <ConfirmarPagoDirecto pagoId={pago.id} voucherExistente={pago.voucherUrl} metodoPagoExistente={pago.metodoPago} onSuccess={() => pagosQuery.refetch()} />
                      )}
                    </div>
                  </div>

                  {/* Voucher info — visible cuando hay voucher */}
                  {pago.voucherUrl && (
                    <div className="mt-3 ml-15 pl-[60px] flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      <div className="flex-1">
                        <p className="text-xs text-white/70">
                          🧾 <span className="font-semibold text-white">Monto declarado:</span> {formatCurrency(Number(pago.montoDeclarado || 0))}
                          {pago.metodoPago && <span className="ml-2 text-white/50">• {pago.metodoPago === 'crypto' ? 'Crypto/USDT' : 'Transferencia bancaria'}</span>}
                        </p>
                        {pago.voucherNotaAdmin && (
                          <p className="text-[10px] text-white/50 mt-1">Nota: {pago.voucherNotaAdmin}</p>
                        )}
                      </div>
                      <a href={pago.voucherUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium hover:bg-blue-500/20 transition-colors">
                        <Eye className="h-3 w-3" /> Ver voucher
                      </a>
                      {pago.estatusPago === 'en_revision_voucher' && (
                        <>
                          <button
                            onClick={async () => {
                              if (!confirm('¿Aprobar este voucher y confirmar el pago?')) return;
                              try {
                                await api.post(`/financiero/pagos/${pago.id}/confirmar-pago-admin`, {
                                  voucherUrl: pago.voucherUrl,
                                  metodoPago: pago.metodoPago || 'transferencia_bancaria',
                                  nota: 'Aprobado por administrador',
                                });
                                pagosQuery.refetch();
                              } catch { alert('Error al aprobar'); }
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                          >
                            <ThumbsUp className="h-3 w-3" /> Aprobar
                          </button>
                          <button
                            onClick={async () => {
                              const nota = prompt('Razón del rechazo (obligatorio):');
                              if (!nota) return;
                              try {
                                await api.post(`/financiero/pagos/${pago.id}/voucher/rechazar`, { nota });
                                pagosQuery.refetch();
                              } catch { alert('Error al rechazar'); }
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition-colors"
                          >
                            <ThumbsDown className="h-3 w-3" /> Rechazar
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Pago pendiente sin voucher: ya se muestra en la fila principal */}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmarPagoDirecto({ pagoId, voucherExistente, metodoPagoExistente, onSuccess }: { pagoId: string; voucherExistente?: string; metodoPagoExistente?: string; onSuccess: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [metodoPago, setMetodoPago] = useState(metodoPagoExistente || 'transferencia_bancaria');
  const [uploading, setUploading] = useState(false);

  const handleConfirmar = async () => {
    setUploading(true);
    try {
      let voucherUrl = voucherExistente || 'sin-comprobante';
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('nombre', `Comprobante pago - ${metodoPago}`);
        formData.append('categoria', 'comprobante_pago');
        const uploadRes = await api.post('/documentos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        voucherUrl = uploadRes.data?.storageKey || uploadRes.data?.id || 'admin-uploaded';
      }

      await api.post(`/financiero/pagos/${pagoId}/confirmar-pago-admin`, {
        voucherUrl,
        metodoPago,
        nota: 'Confirmado manualmente por administrador',
      });

      toast.success('✅ Pago confirmado y marcado como Pagado');
      setShowForm(false);
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al confirmar el pago'));
    } finally {
      setUploading(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
      >
        <ThumbsUp className="h-3 w-3" /> Confirmar pago
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
      <div className="bg-[#171717] rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 border border-[#3a3a3a]" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-white mb-4">✅ Confirmar pago manual</h3>
        <p className="text-xs text-white/50 mb-4">El pago pasará a estado <span className="text-emerald-400 font-semibold">Pagado</span> inmediatamente. Adjunta el comprobante si lo tienes.</p>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-white/70 uppercase font-semibold block mb-1">Método de pago</label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#252525] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="transferencia_bancaria">Transferencia bancaria</option>
              <option value="efectivo">Efectivo (OXXO/depósito)</option>
              <option value="crypto">Crypto/USDT</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-white/70 uppercase font-semibold block mb-1">Comprobante (opcional)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-white/70 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#252525] file:text-white/70 hover:file:bg-[#333333] file:cursor-pointer border border-[#3a3a3a] rounded-lg bg-[#1a1a1a] py-1.5 px-2"
            />
            {file && <p className="text-[10px] text-emerald-400 mt-1">✓ {file.name}</p>}
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleConfirmar}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <ThumbsUp className="h-4 w-4" />
              {uploading ? 'Confirmando...' : 'Confirmar pago'}
            </button>
            <button
              onClick={() => { setShowForm(false); setFile(null); }}
              className="px-4 py-2.5 text-sm text-white/70 border border-[#3a3a3a] rounded-lg hover:bg-[#222222] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
