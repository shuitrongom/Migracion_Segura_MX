'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, Clock, CheckCircle, XCircle, RefreshCw, Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

const ESTATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  aprobado: { label: 'Pagado', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  rechazado: { label: 'Rechazado', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  cancelado: { label: 'Cancelado', color: 'bg-gray-50 text-gray-600 border-gray-200', icon: XCircle },
};

const TIPO_PAGO_LABELS: Record<string, string> = {
  anticipo: '50% Anticipo',
  liquidacion: '50% Liquidación',
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
      const tramitesRes = await api.get('/tramites?page=1&limit=100');
      const tramites = tramitesRes.data?.data || [];
      const allPagos: any[] = [];
      for (const t of tramites) {
        try {
          const pagosRes = await api.get(`/financiero/pagos/tramite/${t.id}`);
          const pagos = Array.isArray(pagosRes.data) ? pagosRes.data : [];
          pagos.forEach((p: any) => allPagos.push({ ...p, tramite: t }));
        } catch {}
      }
      return allPagos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    staleTime: 30000,
  });

  const pagos = pagosQuery.data || [];
  const totalAprobado = pagos.filter(p => p.estatusPago === 'aprobado').reduce((sum, p) => sum + Number(p.monto), 0);
  const totalPendiente = pagos.filter(p => p.estatusPago === 'pendiente').reduce((sum, p) => sum + Number(p.monto), 0);
  const totalCancelado = pagos.filter(p => p.estatusPago === 'cancelado').reduce((sum, p) => sum + Number(p.monto), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-bl from-gray-900 via-stone-800 to-amber-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">Módulo Financiero</h1>
          <p className="text-amber-200 mt-1">Control detallado de pagos, ingresos y adeudos</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500">Total Cobrado</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/30">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAprobado)}</p>
            <p className="text-xs text-green-600 mt-1">{pagos.filter(p => p.estatusPago === 'aprobado').length} confirmados</p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500 to-amber-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500">Pendiente</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-200/30">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPendiente)}</p>
            <p className="text-xs text-yellow-600 mt-1">{pagos.filter(p => p.estatusPago === 'pendiente').length} por cobrar</p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500">Cancelado</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-200/30">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCancelado)}</p>
            <p className="text-xs text-red-600 mt-1">{pagos.filter(p => p.estatusPago === 'cancelado').length} cancelados</p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-500 to-amber-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500">Total Generado</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-amber-600 text-white shadow-lg shadow-brand-200/30">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAprobado + totalPendiente)}</p>
            <p className="text-xs text-brand-600 mt-1">{pagos.length} pagos totales</p>
          </div>
        </div>
      </div>

      {/* Tabla de pagos */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-50"><DollarSign className="h-4 w-4 text-brand-600" /></div>
            <h2 className="text-lg font-bold text-gray-900">Registro de Pagos</h2>
          </div>
          <button onClick={() => pagosQuery.refetch()} className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {pagosQuery.isLoading ? (
          <div className="p-6 space-y-4">{[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}</div>
        ) : pagos.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-100 to-amber-100 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-brand-400" />
            </div>
            <p className="text-gray-500 font-medium">No hay pagos registrados</p>
            <p className="text-xs text-gray-400 mt-1">Los pagos aparecerán aquí cuando se generen desde Continuar Trámite</p>
          </div>
        ) : (
          <div className="divide-y">
            {pagos.map((pago: any) => {
              const config = ESTATUS_CONFIG[pago.estatusPago] || ESTATUS_CONFIG.pendiente;
              const Icon = config.icon;
              return (
                <div key={pago.id} className="flex items-center justify-between px-6 py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-100 to-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <DollarSign className="h-5 w-5 text-brand-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{pago.tramite?.cliente?.nombreCompleto || pago.tramite?.datosFormulario?.nombre || '—'}</p>
                      <p className="text-xs text-gray-500">{pago.concepto} • {pago.createdAt?.slice(0, 10)}</p>
                      <p className="text-[10px] text-gray-400">{pago.tramite?.numeroPieza || pago.tramiteId?.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-100">
                      {TIPO_PAGO_LABELS[pago.tipoPago] || pago.tipoPago}
                    </span>
                    <p className="font-mono font-bold text-gray-900">{formatCurrency(Number(pago.monto))}</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${config.color}`}>
                      <Icon className="h-3 w-3" /> {config.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
