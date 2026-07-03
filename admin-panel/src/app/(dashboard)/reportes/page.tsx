'use client';

import { useState } from 'react';
import { BarChart3, Calendar, TrendingUp, Users, FileText, Activity, Download, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function ReportesPage() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());

  // Queries
  const reporteQuery = useQuery({
    queryKey: ['reportes', 'mensual', mes, anio],
    queryFn: async () => {
      try {
        const res = await api.get(`/financiero/reporte-mensual?mes=${mes}&anio=${anio}`);
        return res.data;
      } catch { return { totalIngresos: 0, totalPagos: 0, porMetodo: [] }; }
    },
  });

  const tramitesQuery = useQuery({
    queryKey: ['reportes', 'tramites'],
    queryFn: async () => {
      try {
        const res = await api.get('/tramites?page=1&limit=200');
        return res.data;
      } catch { return { data: [] }; }
    },
  });

  const solicitudesQuery = useQuery({
    queryKey: ['reportes', 'solicitudes'],
    queryFn: async () => {
      try {
        const res = await api.get('/solicitudes?page=1&limit=200');
        return res.data;
      } catch { return { data: [] }; }
    },
    retry: 2,
  });

  const clientesQuery = useQuery({
    queryKey: ['reportes', 'clientes'],
    queryFn: async () => {
      try {
        const res = await api.get('/clientes?page=1&limit=200');
        return res.data;
      } catch { return { data: [] }; }
    },
  });

  // Pagos reales de la tabla pagos (como lo hace el financiero)
  const pagosQuery = useQuery({
    queryKey: ['reportes', 'pagos-todos'],
    queryFn: async () => {
      const allPagos: any[] = [];
      try {
        // 1. Pagos de trámites
        const tramitesRes = await api.get('/tramites?page=1&limit=200');
        const tramitesList = tramitesRes.data?.data || [];
        for (const t of tramitesList) {
          try {
            const pagosRes = await api.get(`/financiero/pagos/tramite/${t.id}`);
            const pagos = Array.isArray(pagosRes.data) ? pagosRes.data : [];
            pagos.forEach((p: any) => allPagos.push({ ...p, origen: 'tramite' }));
          } catch {}
        }

        // 2. Solicitudes como pagos (igual que financiero page)
        const solRes = await api.get('/solicitudes?page=1&limit=200');
        const solicitudesList = solRes.data?.data || [];
        for (const sol of solicitudesList) {
          if (sol.estatus === 'pagada' || sol.mercadopagoPreferenceId || sol.costo) {
            allPagos.push({
              id: sol.id + '-sol',
              monto: sol.costo || 100,
              concepto: `Solicitud INM - ${(sol.tipoTramite || '').replace(/_/g, ' ')}`,
              estatusPago: sol.estatus === 'pagada' ? 'aprobado' : sol.estatus === 'cancelada' ? 'cancelado' : 'pendiente',
              tipoPago: 'pago_unico',
              metodoPago: sol.metodoPago || 'manual',
              createdAt: sol.createdAt,
              fechaPago: sol.fechaPago,
              origen: 'solicitud',
              solicitud: sol,
            });
          }
        }
      } catch {}
      return allPagos;
    },
  });

  const tramites = tramitesQuery.data?.data || [];
  const solicitudes = solicitudesQuery.data?.data || [];
  const clientes = clientesQuery.data?.data || [];
  const reporte = reporteQuery.data;
  const pagosReales = pagosQuery.data || [];

  // ═══ CÁLCULOS DE INGRESOS ═══

  // Todos los pagos aprobados del mes seleccionado (trámites + solicitudes)
  const pagosAprobadosMes = pagosReales.filter((p: any) => {
    if (p.estatusPago !== 'aprobado') return false;
    const fecha = p.fechaPago || p.createdAt;
    if (!fecha) return false;
    const match = String(fecha).match(/(\d{4})-(\d{2})/);
    if (match) return parseInt(match[2]) === mes && parseInt(match[1]) === anio;
    return false;
  });

  // Separar por origen
  const pagosTramitesMes = pagosAprobadosMes.filter((p: any) => p.origen === 'tramite');
  const pagosSolicitudesMes = pagosAprobadosMes.filter((p: any) => p.origen === 'solicitud');

  const ingresosTramites = pagosTramitesMes.reduce((sum: number, p: any) => sum + (parseFloat(p.monto) || 0), 0);
  const ingresosSolicitudes = pagosSolicitudesMes.reduce((sum: number, p: any) => sum + (parseFloat(p.monto) || 0), 0);

  // TOTAL GENERAL del mes
  const totalIngresosMes = ingresosTramites + ingresosSolicitudes;
  const totalPagosMes = pagosAprobadosMes.length;

  // ═══ CÁLCULOS DE ESTATUS ═══
  const estatusCounts: Record<string, number> = {};
  tramites.forEach((t: any) => { estatusCounts[t.estatus] = (estatusCounts[t.estatus] || 0) + 1; });
  solicitudes.forEach((s: any) => { estatusCounts[s.estatus] = (estatusCounts[s.estatus] || 0) + 1; });

  const tipoCounts: Record<string, number> = {};
  tramites.forEach((t: any) => {
    const tipo = (t.tipo || 'otro').replace(/_/g, ' ');
    tipoCounts[tipo] = (tipoCounts[tipo] || 0) + 1;
  });
  solicitudes.forEach((s: any) => {
    const tipo = `Solicitud: ${(s.tipoTramite || 'generación').replace(/_/g, ' ')}`;
    tipoCounts[tipo] = (tipoCounts[tipo] || 0) + 1;
  });

  // Totales generales
  const totalTramitesYSolicitudes = tramites.length + solicitudes.length;
  const totalAprobados = pagosReales.filter((p: any) => p.estatusPago === 'aprobado').length;
  const totalEnProceso = pagosReales.filter((p: any) => p.estatusPago === 'pendiente' || p.estatusPago === 'en_revision_voucher').length + (estatusCounts['pendiente_revision'] || 0) + (estatusCounts['en_proceso'] || 0);

  // Históricos
  const totalPagosAprobados = pagosReales.filter((p: any) => p.estatusPago === 'aprobado').length;
  const ingresosTotalHistorico = pagosReales.filter((p: any) => p.estatusPago === 'aprobado').reduce((sum: number, p: any) => sum + (parseFloat(p.monto) || 0), 0);

  const isLoading = tramitesQuery.isLoading || solicitudesQuery.isLoading || clientesQuery.isLoading || reporteQuery.isLoading || pagosQuery.isLoading;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-neutral-900 via-stone-800 to-amber-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reportes</h1>
            <p className="text-amber-200 mt-1">Corte mensual — Estadísticas y métricas del negocio</p>
          </div>
          <button
            onClick={async () => {
              try {
                toast.info('Generando PDF...');
                const res = await api.get(`/reportes/pdf/mensual?mes=${mes}&anio=${anio}`, { responseType: 'blob' });
                const blob = new Blob([res.data], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `reporte-${MESES[mes-1]}-${anio}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success('PDF descargado');
              } catch { toast.error('Error al generar PDF'); }
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#222222] backdrop-blur-sm text-white rounded-xl text-sm font-semibold hover:bg-[#171717]/30 transition-all border border-white/20"
          >
            <Download className="h-4 w-4" /> Descargar PDF
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : (
        <>
          {/* Metric cards principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <MetricCard label="Total Operaciones" value={totalTramitesYSolicitudes} icon={<FileText className="h-5 w-5" />} colors="from-amber-500 to-amber-600" subtitle={`${tramites.length} trámites + ${solicitudes.length} solicitudes`} />
            <MetricCard label="Total Clientes" value={clientes.length} icon={<Users className="h-5 w-5" />} colors="from-blue-500 to-blue-600" />
            <MetricCard label="Pagos Confirmados" value={totalAprobados} icon={<CheckCircle className="h-5 w-5" />} colors="from-emerald-500 to-emerald-600" subtitle={formatCurrency(ingresosTotalHistorico)} />
            <MetricCard label="Por Cobrar" value={totalEnProceso} icon={<Clock className="h-5 w-5" />} colors="from-orange-500 to-orange-600" />
          </div>

          {/* ═══ SECCIÓN FINANCIERA — CORTE MENSUAL ═══ */}
          <div className="dark-card-static p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg"><DollarSign className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-lg font-bold text-white">Corte Financiero Mensual</h2>
                  <p className="text-xs text-white/50">Ingresos confirmados (trámites + solicitudes)</p>
                </div>
              </div>
              <div className="flex gap-2">
                <select value={mes} onChange={e => setMes(Number(e.target.value))} className="px-3 py-2 border border-[#3a3a3a] rounded-xl text-sm bg-[#222222] text-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                  {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select value={anio} onChange={e => setAnio(Number(e.target.value))} className="px-3 py-2 border border-[#3a3a3a] rounded-xl text-sm bg-[#222222] text-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                  {[2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {/* Total grande */}
            <div className="text-center mb-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-emerald-600/10 border border-emerald-500/20">
              <p className="text-sm text-emerald-400 font-semibold uppercase tracking-wider mb-2">Ingresos totales — {MESES[mes - 1]} {anio}</p>
              <p className="text-5xl font-bold text-white">{formatCurrency(totalIngresosMes)}</p>
              <p className="text-sm text-white/50 mt-2">{totalPagosMes} operaciones confirmadas</p>
            </div>

            {/* Desglose */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Ingresos por Trámites */}
              <div className="p-5 rounded-xl border border-[#3a3a3a] bg-[#1a1a1a]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <p className="text-sm font-semibold text-white">Trámites Migratorios</p>
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(ingresosTramites)}</p>
                <p className="text-xs text-white/50 mt-1">{pagosTramitesMes.length} pagos confirmados</p>
                {reporte?.porMetodo?.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {reporte.porMetodo.map((m: any) => (
                      <div key={m.metodoPago} className="flex items-center justify-between text-xs">
                        <span className="text-white/60 capitalize">{(m.metodoPago || 'otro').replace(/_/g, ' ')}</span>
                        <span className="text-white font-medium">{formatCurrency(m.total)} <span className="text-white/40">({m.cantidad})</span></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ingresos por Solicitudes */}
              <div className="p-5 rounded-xl border border-[#3a3a3a] bg-[#1a1a1a]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <p className="text-sm font-semibold text-white">Solicitudes INM ($100 c/u)</p>
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(ingresosSolicitudes)}</p>
                <p className="text-xs text-white/50 mt-1">{pagosSolicitudesMes.length} solicitudes pagadas en {MESES[mes - 1]}</p>
                {pagosSolicitudesMes.length > 0 && (
                  <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto">
                    {pagosSolicitudesMes.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <span className="text-white/60 truncate max-w-[150px]">{p.concepto || 'Solicitud'}</span>
                        <span className="text-emerald-400 font-medium">{formatCurrency(parseFloat(p.monto) || 100)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Resumen histórico */}
            <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
              <p className="text-xs text-white/50 uppercase font-semibold mb-2">Histórico total (todas las fechas)</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-white">{totalPagosAprobados}</p>
                  <p className="text-[10px] text-white/50">Pagos confirmados</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(ingresosTotalHistorico)}</p>
                  <p className="text-[10px] text-white/50">Ingresos totales</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{clientes.length}</p>
                  <p className="text-[10px] text-white/50">Clientes registrados</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grid: Tipo + Estatus */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Por tipo */}
            <div className="dark-card-static p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 rounded-lg bg-amber-500/10"><Activity className="h-4 w-4 text-amber-600" /></div>
                <h2 className="text-lg font-bold text-white">Operaciones por Tipo</h2>
              </div>
              {Object.keys(tipoCounts).length === 0 ? (
                <p className="text-sm text-white/50 text-center py-6">Sin operaciones registradas</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(tipoCounts).sort((a, b) => b[1] - a[1]).map(([tipo, count]) => (
                    <div key={tipo} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors">
                      <span className="text-sm text-white/70 w-44 shrink-0 font-medium capitalize truncate">{tipo}</span>
                      <div className="flex-1 h-7 bg-[#222222] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-700" style={{ width: `${Math.min((count / Math.max(totalTramitesYSolicitudes, 1)) * 100, 100)}%` }} />
                      </div>
                      <span className="text-sm font-bold text-white w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Por estatus */}
            <div className="dark-card-static p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 rounded-lg bg-emerald-500/10"><TrendingUp className="h-4 w-4 text-emerald-400" /></div>
                <h2 className="text-lg font-bold text-white">Distribución por Estatus</h2>
              </div>
              {Object.keys(estatusCounts).length === 0 ? (
                <p className="text-sm text-white/50 text-center py-6">Sin datos</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(estatusCounts).sort((a, b) => b[1] - a[1]).map(([estatus, count]) => (
                    <div key={estatus} className="text-center p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-amber-500/30 transition-colors">
                      <p className="text-2xl font-bold text-white">{count}</p>
                      <p className="text-[10px] text-white/60 capitalize mt-1 font-medium">{estatus.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon, colors, subtitle }: { label: string; value: number | string; icon: React.ReactNode; colors: string; subtitle?: string }) {
  return (
    <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-white/70">{label}</p>
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colors} text-white shadow-lg`}>{icon}</div>
        </div>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-xs text-white/50 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
