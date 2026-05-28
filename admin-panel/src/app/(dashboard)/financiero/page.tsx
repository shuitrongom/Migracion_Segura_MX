'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, AlertCircle, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

const ESTATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-50 text-yellow-700', icon: Clock },
  aprobado: { label: 'Pagado', color: 'bg-green-50 text-green-700', icon: CheckCircle },
  rechazado: { label: 'Rechazado', color: 'bg-red-50 text-red-700', icon: XCircle },
  cancelado: { label: 'Cancelado', color: 'bg-gray-50 text-gray-600', icon: XCircle },
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

  // Reporte mensual
  const reporteQuery = useQuery({
    queryKey: ['financiero', 'reporte', mes, anio],
    queryFn: async () => {
      const res = await api.get(`/financiero/reporte-mensual?mes=${mes}&anio=${anio}`);
      return res.data;
    },
  });

  // Todos los trámites para obtener pagos
  const pagosQuery = useQuery({
    queryKey: ['financiero', 'pagos-all'],
    queryFn: async () => {
      // Obtener trámites y sus pagos
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
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Módulo Financiero</h1>
          <p className="text-sm text-gray-500 mt-1">Control detallado de pagos, ingresos y adeudos</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Cobrado</p>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAprobado)}</p>
          <p className="text-xs text-green-600 mt-1">{pagos.filter(p => p.estatusPago === 'aprobado').length} pagos confirmados</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase">Pendiente de Cobro</p>
            <Clock className="h-4 w-4 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPendiente)}</p>
          <p className="text-xs text-yellow-600 mt-1">{pagos.filter(p => p.estatusPago === 'pendiente').length} pagos por cobrar</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase">Cancelado/Vencido</p>
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCancelado)}</p>
          <p className="text-xs text-red-600 mt-1">{pagos.filter(p => p.estatusPago === 'cancelado').length} pagos cancelados</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Generado</p>
            <DollarSign className="h-4 w-4 text-brand-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAprobado + totalPendiente)}</p>
          <p className="text-xs text-brand-600 mt-1">{pagos.length} pagos totales</p>
        </div>
      </div>

      {/* Tabla de pagos */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Registro de Pagos</h2>
          <button onClick={() => pagosQuery.refetch()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {pagosQuery.isLoading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : pagos.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No hay pagos registrados</p>
            <p className="text-xs text-gray-400 mt-1">Los pagos aparecerán aquí cuando se generen desde "Continuar Trámite"</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Cliente / Trámite</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Concepto</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Tipo</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Monto</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Estatus</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Referencia MP</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago: any) => {
                  const config = ESTATUS_CONFIG[pago.estatusPago] || ESTATUS_CONFIG.pendiente;
                  const Icon = config.icon;
                  return (
                    <tr key={pago.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{pago.createdAt?.slice(0, 10)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 text-xs">{pago.tramite?.cliente?.nombreCompleto || pago.tramite?.datosFormulario?.nombre || '—'}</p>
                        <p className="text-xs text-gray-400">{pago.tramite?.numeroPieza || pago.tramiteId?.slice(0, 8)}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{pago.concepto}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                          {TIPO_PAGO_LABELS[pago.tipoPago] || pago.tipoPago}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatCurrency(Number(pago.monto))}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{pago.mercadopagoPaymentId || pago.referencia || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historial de auditoría */}
      {pagos.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden mt-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Historial de Auditoría</h2>
            <p className="text-xs text-gray-500 mt-1">Registro inmutable de todas las acciones sobre pagos</p>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto">
            <div className="space-y-2">
              {pagos.flatMap((pago: any) => 
                (pago.historial || []).map((h: any, i: number) => (
                  <div key={`${pago.id}-${i}`} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 text-sm">
                    <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700">{h.detalle}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{h.fecha?.slice(0, 16).replace('T', ' ')} · {h.accion}</p>
                    </div>
                    <span className="text-xs font-mono text-gray-400 shrink-0">{formatCurrency(Number(pago.monto))}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
