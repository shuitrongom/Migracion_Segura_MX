'use client';

import { useState } from 'react';
import {
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { useDashboardMetrics, useCitasHoy, useRecentActivity } from '@/hooks/use-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Cita, Tramite } from '@/lib/types';

const ESTATUS_DISTRIBUTION = [
  { estatus: 'Borrador', cantidad: 8, color: 'bg-gray-400' },
  { estatus: 'Recibido', cantidad: 12, color: 'bg-blue-400' },
  { estatus: 'En revisión', cantidad: 15, color: 'bg-yellow-400' },
  { estatus: 'En espera', cantidad: 11, color: 'bg-orange-400' },
  { estatus: 'Aprobado', cantidad: 67, color: 'bg-green-400' },
  { estatus: 'Rechazado', cantidad: 12, color: 'bg-red-400' },
  { estatus: 'Cancelado', cantidad: 4, color: 'bg-gray-300' },
];

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState({ from: '2024-03-01', to: '2024-03-18' });

  const metricsQuery = useDashboardMetrics();
  const citasHoyQuery = useCitasHoy();
  const recentActivityQuery = useRecentActivity();

  const totalTramites = ESTATUS_DISTRIBUTION.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div>
      {/* Header with date filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="date-from" className="sr-only">Fecha desde</label>
          <input
            id="date-from"
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Fecha desde"
          />
          <span className="text-gray-400 text-sm">a</span>
          <label htmlFor="date-to" className="sr-only">Fecha hasta</label>
          <input
            id="date-to"
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Fecha hasta"
          />
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricsQuery.isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : metricsQuery.isError ? (
          <div className="col-span-full text-center py-8 text-red-500 text-sm">
            Error al cargar métricas. Intenta recargar la página.
          </div>
        ) : (
          <>
            <MetricCard
              title="Total Clientes"
              value={metricsQuery.data?.totalClientes?.toString() ?? '--'}
              icon={<Users className="h-5 w-5 text-brand-500" />}
              trend="--"
            />
            <MetricCard
              title="Total Trámites"
              value={metricsQuery.data?.totalTramites?.toString() ?? '--'}
              icon={<FileText className="h-5 w-5 text-brand-500" />}
              trend="--"
            />
            <MetricCard
              title="Docs por Vencer"
              value={metricsQuery.data?.documentosPorVencer?.toString() ?? '--'}
              icon={<AlertTriangle className="h-5 w-5 text-warning-500" />}
              trend="--"
            />
            <MetricCard
              title="Citas Hoy"
              value={citasHoyQuery.data?.length?.toString() ?? '--'}
              icon={<Calendar className="h-5 w-5 text-brand-500" />}
              trend="--"
            />
          </>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KPICard
          title="Tiempo Promedio Resolución"
          value="--"
          icon={<Clock className="h-5 w-5 text-brand-500" />}
        />
        <KPICard
          title="Tasa de Aprobación"
          value="--"
          icon={<TrendingUp className="h-5 w-5 text-success-500" />}
        />
        <KPICard
          title="Tasa Docs Rechazados"
          value="--"
          icon={<AlertTriangle className="h-5 w-5 text-warning-500" />}
        />
      </div>

      {/* Charts and activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Estatus distribution chart placeholder */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Estatus</h2>
          <div className="space-y-3">
            {ESTATUS_DISTRIBUTION.map((item) => (
              <div key={item.estatus} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24 shrink-0">{item.estatus}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${(item.cantidad / totalTramites) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">
                  {item.cantidad}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's appointments */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-brand-500" />
            <h2 className="text-lg font-semibold text-gray-900">Citas de Hoy</h2>
          </div>
          {citasHoyQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : citasHoyQuery.isError ? (
            <p className="text-red-500 text-sm">Error al cargar citas.</p>
          ) : !citasHoyQuery.data || citasHoyQuery.data.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay citas programadas para hoy.</p>
          ) : (
            <div className="space-y-3">
              {citasHoyQuery.data.map((cita: Cita) => (
                <div
                  key={cita.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-medium text-brand-600">
                      {cita.horaInicio}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {cita.cliente ? (cita.cliente.nombreCompleto || `${cita.cliente.nombre || ''} ${cita.cliente.apellidos || ''}`.trim() || 'Cliente') : 'Cliente'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {cita.asesor?.fullName ?? 'Asesor'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      cita.modalidad === 'videollamada'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-green-50 text-green-700'
                    }`}
                  >
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
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : recentActivityQuery.isError ? (
          <p className="text-red-500 text-sm">Error al cargar actividad reciente.</p>
        ) : !recentActivityQuery.data || recentActivityQuery.data.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay actividad reciente.</p>
        ) : (
          <div className="space-y-3">
            {recentActivityQuery.data.map((tramite: Tramite) => (
              <div
                key={tramite.id}
                className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-b-0"
              >
                <div className="w-2 h-2 rounded-full bg-brand-400 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    Trámite {tramite.numeroPieza ?? tramite.id} — {tramite.estatus}
                    {tramite.cliente && ` (${tramite.cliente.nombreCompleto || `${tramite.cliente.nombre || ''} ${tramite.cliente.apellidos || ''}`.trim()})`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{tramite.createdAt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{trend}</p>
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <Skeleton className="h-9 w-16 mb-1" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

function KPICard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border flex items-center gap-4">
      <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
