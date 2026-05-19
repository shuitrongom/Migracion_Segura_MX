'use client';

import {
  Users,
  FileText,
  Calendar,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useDashboardMetrics, useCitasHoy, useRecentActivity } from '@/hooks/use-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import type { Cita, Tramite } from '@/lib/types';

const ESTATUS_CONFIG: { key: string; label: string; color: string }[] = [
  { key: 'borrador', label: 'Borrador', color: 'bg-gray-400' },
  { key: 'recibido', label: 'Recibido', color: 'bg-blue-400' },
  { key: 'en_revision', label: 'En revisión', color: 'bg-yellow-400' },
  { key: 'en_espera_resolucion', label: 'En espera', color: 'bg-orange-400' },
  { key: 'aprobado', label: 'Aprobado', color: 'bg-green-400' },
  { key: 'rechazado', label: 'Rechazado', color: 'bg-red-400' },
  { key: 'cancelado', label: 'Cancelado', color: 'bg-gray-300' },
];

export default function DashboardPage() {
  const metricsQuery = useDashboardMetrics();
  const citasHoyQuery = useCitasHoy();
  const recentActivityQuery = useRecentActivity();

  // Distribución por estatus - datos reales
  const estatusQuery = useQuery({
    queryKey: ['dashboard', 'estatus-distribution'],
    queryFn: async () => {
      // Traer trámites (máximo 100 por limitación del API)
      const res = await api.get('/tramites', { params: { page: 1, limit: 100 } });
      const tramites = res.data?.data || [];
      const counts: Record<string, number> = {};
      tramites.forEach((t: any) => { counts[t.estatus] = (counts[t.estatus] || 0) + 1; });
      return ESTATUS_CONFIG.map(item => ({ ...item, cantidad: counts[item.key] || 0 }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const estatusData = estatusQuery.data || [];
  const totalTramitesEstatus = estatusData.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {metricsQuery.isLoading ? (
          <>{[1,2,3].map(i => <MetricCardSkeleton key={i} />)}</>
        ) : metricsQuery.isError ? (
          <div className="col-span-full text-center py-8 text-red-500 text-sm">Error al cargar métricas.</div>
        ) : (
          <>
            <MetricCard title="Total Clientes" value={metricsQuery.data?.totalClientes?.toString() ?? '0'} icon={<Users className="h-5 w-5 text-brand-500" />} />
            <MetricCard title="Total Trámites" value={metricsQuery.data?.totalTramites?.toString() ?? '0'} icon={<FileText className="h-5 w-5 text-brand-500" />} />
            <MetricCard title="Citas Hoy" value={citasHoyQuery.data?.length?.toString() ?? '0'} icon={<Calendar className="h-5 w-5 text-brand-500" />} />
          </>
        )}
      </div>

      {/* Charts and activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Estatus distribution - datos reales */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Estatus</h2>
          {estatusQuery.isLoading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-6 w-full" />)}</div>
          ) : totalTramitesEstatus === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No hay trámites registrados</p>
          ) : (
            <div className="space-y-3">
              {estatusData.filter(item => item.cantidad > 0).map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24 shrink-0">{item.label}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${(item.cantidad / totalTramitesEstatus) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-8 text-right">{item.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's appointments */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-brand-500" />
            <h2 className="text-lg font-semibold text-gray-900">Citas de Hoy</h2>
          </div>
          {citasHoyQuery.isLoading ? (
            <div className="space-y-3"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>
          ) : citasHoyQuery.isError ? (
            <p className="text-red-500 text-sm">Error al cargar citas.</p>
          ) : !citasHoyQuery.data || citasHoyQuery.data.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No hay citas programadas para hoy.</p>
          ) : (
            <div className="space-y-3">
              {citasHoyQuery.data.map((cita: Cita) => (
                <div key={cita.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-medium text-brand-600">{cita.horaInicio}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cita.cliente?.nombreCompleto || 'Cliente'}</p>
                      <p className="text-xs text-gray-500">{cita.asesor?.fullName ?? 'Gestor'}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cita.modalidad === 'videollamada' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                    {cita.modalidad === 'videollamada' ? 'Videollamada' : 'Presencial'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
        {recentActivityQuery.isLoading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : recentActivityQuery.isError ? (
          <p className="text-red-500 text-sm">Error al cargar actividad reciente.</p>
        ) : !recentActivityQuery.data || recentActivityQuery.data.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No hay actividad reciente.</p>
        ) : (
          <div className="space-y-3">
            {recentActivityQuery.data.map((tramite: Tramite) => (
              <div key={tramite.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-b-0">
                <div className="w-2 h-2 rounded-full bg-brand-400 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 capitalize">
                    Trámite {tramite.numeroPieza ?? tramite.id.slice(0, 8)} — {tramite.estatus?.replace(/_/g, ' ')}
                    {tramite.cliente && ` (${tramite.cliente.nombreCompleto || ''})`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{tramite.createdAt ? new Date(tramite.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-5 w-5 rounded" /></div>
      <Skeleton className="h-9 w-16" />
    </div>
  );
}
