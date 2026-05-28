'use client';

import { useState } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, Users, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

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

  // Estadísticas de trámites por estatus
  const estatusCounts: Record<string, number> = {};
  tramites.forEach((t: any) => { estatusCounts[t.estatus] = (estatusCounts[t.estatus] || 0) + 1; });

  // Estadísticas de trámites por tipo
  const tipoCounts: Record<string, number> = {};
  tramites.forEach((t: any) => { tipoCounts[t.tipo] = (tipoCounts[t.tipo] || 0) + 1; });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500 mt-1">Estadísticas y métricas del negocio</p>
        </div>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-2 mb-2"><FileText className="h-4 w-4 text-brand-500" /><p className="text-xs font-medium text-gray-500">Total Trámites</p></div>
          <p className="text-2xl font-bold text-gray-900">{tramites.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-brand-500" /><p className="text-xs font-medium text-gray-500">Total Clientes</p></div>
          <p className="text-2xl font-bold text-gray-900">{clientes.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-green-500" /><p className="text-xs font-medium text-gray-500">Aprobados</p></div>
          <p className="text-2xl font-bold text-green-600">{estatusCounts['aprobado'] || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-2 mb-2"><Calendar className="h-4 w-4 text-yellow-500" /><p className="text-xs font-medium text-gray-500">En proceso</p></div>
          <p className="text-2xl font-bold text-yellow-600">{(estatusCounts['recibido'] || 0) + (estatusCounts['en_revision'] || 0) + (estatusCounts['en_espera_resolucion'] || 0)}</p>
        </div>
      </div>

      {/* Reporte financiero mensual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Ingresos Mensuales</h2>
            <div className="flex gap-2">
              <select value={mes} onChange={e => setMes(Number(e.target.value))} className="px-2 py-1 border rounded text-sm">
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={anio} onChange={e => setAnio(Number(e.target.value))} className="px-2 py-1 border rounded text-sm">
                {[2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          {reporteQuery.isLoading ? <Skeleton className="h-32 w-full" /> : (
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-4">{formatCurrency(reporte?.totalIngresos || 0)}</p>
              <p className="text-sm text-gray-500">{reporte?.totalPagos || 0} pagos en {MESES[mes - 1]} {anio}</p>
              {reporte?.porMetodo?.length > 0 && (
                <div className="mt-4 space-y-2">
                  {reporte.porMetodo.map((m: any) => (
                    <div key={m.metodoPago} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{(m.metodoPago || '').replace(/_/g, ' ')}</span>
                      <span className="font-medium">{formatCurrency(m.total)} ({m.cantidad})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Distribución por tipo de trámite */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trámites por Tipo</h2>
          <div className="space-y-3">
            {Object.entries(tipoCounts).sort((a, b) => b[1] - a[1]).map(([tipo, count]) => (
              <div key={tipo} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-48 truncate capitalize">{tipo.replace(/_/g, ' ')}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-400 rounded-full" style={{ width: `${(count / tramites.length) * 100}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Distribución por estatus */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Trámites por Estatus</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Object.entries(estatusCounts).map(([estatus, count]) => (
            <div key={estatus} className="text-center p-3 rounded-lg bg-gray-50">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 capitalize mt-1">{estatus.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
