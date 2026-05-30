'use client';

import { useState } from 'react';
import { BarChart3, Calendar, TrendingUp, Users, FileText, Activity, Download } from 'lucide-react';
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

  const reporteQuery = useQuery({
    queryKey: ['reportes', 'mensual', mes, anio],
    queryFn: async () => {
      const res = await api.get(`/financiero/reporte-mensual?mes=${mes}&anio=${anio}`);
      return res.data;
    },
  });

  const tramitesQuery = useQuery({
    queryKey: ['reportes', 'tramites'],
    queryFn: async () => {
      const res = await api.get('/tramites?page=1&limit=100');
      return res.data;
    },
  });

  const clientesQuery = useQuery({
    queryKey: ['reportes', 'clientes'],
    queryFn: async () => {
      const res = await api.get('/clientes?page=1&limit=100');
      return res.data;
    },
  });

  const tramites = tramitesQuery.data?.data || [];
  const clientes = clientesQuery.data?.data || [];
  const reporte = reporteQuery.data;

  const estatusCounts: Record<string, number> = {};
  tramites.forEach((t: any) => { estatusCounts[t.estatus] = (estatusCounts[t.estatus] || 0) + 1; });

  const tipoCounts: Record<string, number> = {};
  tramites.forEach((t: any) => { tipoCounts[t.tipo] = (tipoCounts[t.tipo] || 0) + 1; });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-stone-900 via-neutral-800 to-amber-700 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reportes</h1>
            <p className="text-amber-200 mt-1">Estadísticas y métricas del negocio</p>
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
            className="flex items-center gap-2 px-5 py-2.5 bg-[#171717]/20 backdrop-blur-sm text-white rounded-xl text-sm font-semibold hover:bg-[#171717]/30 transition-all border border-white/20"
          >
            <Download className="h-4 w-4" /> Descargar PDF
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-500 to-amber-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/40">Total Trámites</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-amber-600 text-white shadow-lg shadow-amber-500/20/30">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{tramites.length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-amber-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/40">Total Clientes</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-amber-600 text-white shadow-lg shadow-blue-200/30">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{clientes.length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/40">Aprobados</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/30">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{estatusCounts['aprobado'] || 0}</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500 to-amber-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/40">En Proceso</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-200/30">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{(estatusCounts['recibido'] || 0) + (estatusCounts['en_revision'] || 0) + (estatusCounts['en_espera_resolucion'] || 0)}</p>
          </div>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos mensuales */}
        <div className="dark-card-static p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10"><BarChart3 className="h-4 w-4 text-amber-500" /></div>
              <h2 className="text-lg font-bold text-white">Ingresos Mensuales</h2>
            </div>
            <div className="flex gap-2">
              <select value={mes} onChange={e => setMes(Number(e.target.value))} className="px-3 py-1.5 border border-[#2a2a2a] rounded-xl text-sm bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-amber-500">
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={anio} onChange={e => setAnio(Number(e.target.value))} className="px-3 py-1.5 border border-[#2a2a2a] rounded-xl text-sm bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-amber-500">
                {[2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          {reporteQuery.isLoading ? <Skeleton className="h-32 w-full" /> : (
            <div>
              <p className="text-4xl font-bold text-white mb-4">{formatCurrency(reporte?.totalIngresos || 0)}</p>
              <p className="text-sm text-white/40">{reporte?.totalPagos || 0} pagos en {MESES[mes - 1]} {anio}</p>
              {reporte?.porMetodo?.length > 0 && (
                <div className="mt-5 space-y-3">
                  {reporte.porMetodo.map((m: any) => (
                    <div key={m.metodoPago} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-white/[0.02] to-white/[0.04] border hover:border-amber-500/30 transition-colors">
                      <span className="text-sm text-white/60 capitalize font-medium">{(m.metodoPago || '').replace(/_/g, ' ')}</span>
                      <span className="text-sm font-bold text-white">{formatCurrency(m.total)} <span className="text-xs text-white/30">({m.cantidad})</span></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trámites por tipo */}
        <div className="dark-card-static p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-amber-500/10"><Activity className="h-4 w-4 text-amber-600" /></div>
            <h2 className="text-lg font-bold text-white">Trámites por Tipo</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(tipoCounts).sort((a, b) => b[1] - a[1]).map(([tipo, count]) => (
              <div key={tipo} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-[#141414] transition-colors">
                <span className="text-sm text-white/60 w-40 shrink-0 font-medium capitalize truncate">{tipo.replace(/_/g, ' ')}</span>
                <div className="flex-1 h-6 bg-[#1f1f1f] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-400 to-amber-500 rounded-full transition-all duration-700 ease-out group-hover:opacity-90" style={{ width: `${(count / tramites.length) * 100}%` }} />
                </div>
                <span className="text-sm font-bold text-white/90 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Distribución por estatus */}
      <div className="dark-card-static p-6 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-lg bg-emerald-500/10"><TrendingUp className="h-4 w-4 text-emerald-400" /></div>
          <h2 className="text-lg font-bold text-white">Trámites por Estatus</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Object.entries(estatusCounts).map(([estatus, count]) => (
            <div key={estatus} className="relative overflow-hidden text-center p-4 rounded-2xl bg-gradient-to-br from-white/[0.02] to-white/[0.04] border hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-brand-500 to-amber-500 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <p className="text-3xl font-bold text-white">{count}</p>
              <p className="text-xs text-white/40 capitalize mt-1 font-medium">{estatus.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
