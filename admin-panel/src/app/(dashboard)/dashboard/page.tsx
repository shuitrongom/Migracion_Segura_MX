'use client';

import { Users, FileText, Calendar, TrendingUp, DollarSign, Clock, ArrowUpRight, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useDashboardMetrics, useCitasHoy, useRecentActivity } from '@/hooks/use-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import type { Cita, Tramite } from '@/lib/types';

const ESTATUS_CONFIG: { key: string; label: string; color: string; gradient: string }[] = [
  { key: 'borrador', label: 'Borrador', color: 'bg-gray-400', gradient: 'from-gray-400 to-gray-500' },
  { key: 'recibido', label: 'Recibido', color: 'bg-blue-400', gradient: 'from-blue-400 to-amber-600' },
  { key: 'en_revision', label: 'En revisión', color: 'bg-yellow-400', gradient: 'from-yellow-400 to-amber-500' },
  { key: 'en_espera_resolucion', label: 'En espera', color: 'bg-orange-400', gradient: 'from-orange-400 to-orange-600' },
  { key: 'aprobado', label: 'Aprobado', color: 'bg-green-400', gradient: 'from-green-400 to-emerald-600' },
  { key: 'rechazado', label: 'Rechazado', color: 'bg-red-400', gradient: 'from-red-400 to-red-600' },
  { key: 'cancelado', label: 'Cancelado', color: 'bg-gray-300', gradient: 'from-gray-300 to-gray-500' },
];

export default function DashboardPage() {
  const metricsQuery = useDashboardMetrics();
  const citasHoyQuery = useCitasHoy();
  const recentActivityQuery = useRecentActivity();

  const estatusQuery = useQuery({
    queryKey: ['dashboard', 'estatus-distribution'],
    queryFn: async () => {
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-neutral-900 via-stone-800 to-amber-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-amber-200 mt-1">Panel de control — Migración Segura MX</p>
        </div>
      </div>

      {/* Metric cards con animación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {metricsQuery.isLoading ? (
          <>{[1,2,3].map(i => <MetricCardSkeleton key={i} />)}</>
        ) : (
          <>
            <MetricCard title="Total Clientes" value={metricsQuery.data?.totalClientes?.toString() ?? '0'} icon={<Users className="h-5 w-5" />} color="from-blue-500 to-amber-600" trend="+12%" />
            <MetricCard title="Total Trámites" value={metricsQuery.data?.totalTramites?.toString() ?? '0'} icon={<FileText className="h-5 w-5" />} color="from-amber-500 to-amber-600" trend="+8%" />
            <MetricCard title="Citas Hoy" value={citasHoyQuery.data?.length?.toString() ?? '0'} icon={<Calendar className="h-5 w-5" />} color="from-green-500 to-emerald-600" trend="" />
          </>
        )}
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por estatus */}
        <div className="dark-card p-6 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-amber-500/10"><Activity className="h-4 w-4 text-amber-400" /></div>
            <h2 className="text-lg font-bold text-amber-200">Distribución por Estatus</h2>
          </div>
          {estatusQuery.isLoading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-7 w-full" />)}</div>
          ) : totalTramitesEstatus === 0 ? (
            <p className="text-sm text-white/70 text-center py-8">No hay trámites registrados</p>
          ) : (
            <div className="space-y-3">
              {estatusData.filter(item => item.cantidad > 0).map((item) => (
                <div key={item.key} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors">
                  <span className="text-sm text-white/70 w-24 shrink-0 font-medium">{item.label}</span>
                  <div className="flex-1 h-7 bg-[#222222] rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${item.gradient} rounded-full transition-all duration-700 ease-out group-hover:opacity-90`} style={{ width: `${(item.cantidad / totalTramitesEstatus) * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold text-white/90 w-8 text-right">{item.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Citas de hoy */}
        <div className="dark-card p-6 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-emerald-500/10"><Calendar className="h-4 w-4 text-emerald-400" /></div>
            <h2 className="text-lg font-bold text-amber-200">Citas de Hoy</h2>
          </div>
          {citasHoyQuery.isLoading ? (
            <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
          ) : !citasHoyQuery.data || citasHoyQuery.data.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-10 w-10 text-gray-200 mx-auto mb-2" />
              <p className="text-white/70 text-sm">No hay citas para hoy</p>
            </div>
          ) : (
            <div className="space-y-3">
              {citasHoyQuery.data.map((cita: Cita) => (
                <div key={cita.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-white/[0.02] to-white/[0.04] border hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500/10 text-amber-400 font-mono font-bold text-sm px-3 py-1.5 rounded-lg">{cita.horaInicio}</div>
                    <div>
                      <p className="text-sm font-semibold text-white">{cita.cliente?.nombreCompleto || 'Cliente'}</p>
                      <p className="text-xs text-white/70">{cita.asesor?.fullName ?? 'Gestor'}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cita.modalidad === 'videollamada' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {cita.modalidad === 'videollamada' ? '📹 Video' : '🏢 Oficina'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="dark-card p-6 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-lg bg-purple-500/10"><TrendingUp className="h-4 w-4 text-purple-400" /></div>
          <h2 className="text-lg font-bold text-amber-200">Actividad Reciente</h2>
        </div>
        {recentActivityQuery.isLoading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !recentActivityQuery.data || recentActivityQuery.data.length === 0 ? (
          <p className="text-white/70 text-sm text-center py-8">No hay actividad reciente</p>
        ) : (
          <div className="space-y-2">
            {recentActivityQuery.data.map((tramite: Tramite) => (
              <div key={tramite.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#1a1a1a] transition-colors group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/15 to-amber-600/15 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white capitalize truncate">
                    {(tramite.tipo || '').replace(/_/g, ' ')} {tramite.cliente && `— ${tramite.cliente.nombreCompleto || ''}`}
                  </p>
                  <p className="text-xs text-white/70">{tramite.numeroPieza || tramite.id?.slice(0, 8)} · {tramite.estatus?.replace(/_/g, ' ')}</p>
                </div>
                <div className="text-xs text-white/70 shrink-0">
                  {tramite.createdAt ? new Date(tramite.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documentos por vencer */}
      <DocsPorVencerWidget />
    </div>
  );
}

function MetricCard({ title, value, icon, color, trend }: { title: string; value: string; icon: React.ReactNode; color: string; trend: string }) {
  return (
    <div className="relative overflow-hidden dark-card p-6 hover:shadow-lg hover:shadow-amber-900/20 transition-all duration-300 hover:-translate-y-0.5 group">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-white/70">{title}</p>
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg shadow-amber-500/10`}>{icon}</div>
        </div>
        <p className="text-3xl font-bold text-white">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight className="h-3 w-3 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">{trend} este mes</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="dark-card p-6">
      <div className="flex items-center justify-between mb-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-10 rounded-xl" /></div>
      <Skeleton className="h-9 w-16" />
    </div>
  );
}

function DocsPorVencerWidget() {
  const docsQuery = useQuery({
    queryKey: ['dashboard', 'docs-por-vencer'],
    queryFn: async () => {
      const res = await api.get('/documentos/por-vencer');
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const docs = docsQuery.data || [];
  if (docsQuery.isLoading) return null;
  if (docs.length === 0) return null;

  return (
    <div className="dark-card p-6 hover:shadow-lg hover:shadow-red-900/10 transition-all duration-300 border-l-4 border-l-red-500">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded-lg bg-red-500/10"><Clock className="h-4 w-4 text-red-400" /></div>
        <h2 className="text-lg font-bold text-red-300">⚠️ Documentos por vencer (30 días)</h2>
        <span className="ml-auto bg-red-500/10 text-red-400 text-xs font-bold px-2.5 py-1 rounded-full border border-red-500/20">{docs.length}</span>
      </div>
      <div className="space-y-2">
        {docs.slice(0, 10).map((doc: any) => {
          const diasRestantes = Math.ceil((new Date(doc.fechaVencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const urgente = diasRestantes <= 7;
          return (
            <div key={doc.id} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${urgente ? 'bg-red-500/5 border border-red-500/20' : 'hover:bg-[#1a1a1a]'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${urgente ? 'bg-red-500/15' : 'bg-orange-500/15'}`}>
                <span className="text-sm">{urgente ? '🚨' : '⏰'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{doc.nombre}</p>
                <p className="text-xs text-white/50">Vence: {new Date(doc.fechaVencimiento).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${urgente ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                {diasRestantes} días
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
