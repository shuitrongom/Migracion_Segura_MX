'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, BarChart3, Filter, Clock, DollarSign, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { api } from '@/lib/api';

const CHART_COLORS = {
  amber: '#f59e0b',
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
};

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface RevenueData {
  month: string;
  ingresos: number;
}

interface TramiteTypeData {
  tipo: string;
  cantidad: number;
}

interface FunnelData {
  etapa: string;
  cantidad: number;
  porcentaje: number;
}

export default function AnalyticsPage() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [tramiteTypes, setTramiteTypes] = useState<TramiteTypeData[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [metrics, setMetrics] = useState({
    avgResolutionDays: 0,
    totalClientes: 0,
    totalIngresosMes: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  async function fetchAnalyticsData() {
    try {
      setLoading(true);

      // Fetch tramites for type distribution and funnel
      const tramitesRes = await api.get('/tramites', { params: { page: 1, limit: 100 } });
      const tramites = tramitesRes.data?.data || [];

      // Fetch clientes
      const clientesRes = await api.get('/clientes', { params: { page: 1, limit: 100 } });
      const totalClientes = clientesRes.data?.meta?.total || clientesRes.data?.data?.length || 0;

      // Fetch monthly revenue for last 6 months
      const now = new Date();
      const revenuePromises = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mes = date.getMonth() + 1;
        const anio = date.getFullYear();
        revenuePromises.push(
          api.get(`/financiero/reporte-mensual?mes=${mes}&anio=${anio}`).catch(() => ({ data: { totalIngresos: 0 } }))
        );
      }
      const revenueResults = await Promise.all(revenuePromises);

      const revenueChartData: RevenueData[] = revenueResults.map((res, idx) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
        return {
          month: MONTHS[date.getMonth()],
          ingresos: res.data?.totalIngresos || 0,
        };
      });
      setRevenueData(revenueChartData);

      // Tramite type distribution
      const typeCounts: Record<string, number> = {};
      tramites.forEach((t: any) => {
        const tipo = (t.tipo || 'otro').replace(/_/g, ' ');
        typeCounts[tipo] = (typeCounts[tipo] || 0) + 1;
      });
      const typeData: TramiteTypeData[] = Object.entries(typeCounts)
        .map(([tipo, cantidad]) => ({ tipo, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);
      setTramiteTypes(typeData);

      // Conversion funnel
      const statusCounts: Record<string, number> = {};
      tramites.forEach((t: any) => {
        statusCounts[t.estatus] = (statusCounts[t.estatus] || 0) + 1;
      });
      const totalTramites = tramites.length;
      const borradorCount = statusCounts['borrador'] || 0;
      const recibidoCount = statusCounts['recibido'] || 0;
      const enRevisionCount = statusCounts['en_revision'] || 0;
      const aprobadoCount = statusCounts['aprobado'] || 0;

      const funnel: FunnelData[] = [
        { etapa: 'Borrador', cantidad: borradorCount, porcentaje: totalTramites > 0 ? Math.round((borradorCount / totalTramites) * 100) : 0 },
        { etapa: 'Recibido', cantidad: recibidoCount, porcentaje: totalTramites > 0 ? Math.round((recibidoCount / totalTramites) * 100) : 0 },
        { etapa: 'En Revisión', cantidad: enRevisionCount, porcentaje: totalTramites > 0 ? Math.round((enRevisionCount / totalTramites) * 100) : 0 },
        { etapa: 'Aprobado', cantidad: aprobadoCount, porcentaje: totalTramites > 0 ? Math.round((aprobadoCount / totalTramites) * 100) : 0 },
      ];
      setFunnelData(funnel);

      // Metrics
      const currentMonthRevenue = revenueChartData[revenueChartData.length - 1]?.ingresos || 0;
      const conversionRate = totalTramites > 0 ? Math.round((aprobadoCount / totalTramites) * 100) : 0;

      // Calculate average resolution time (days between createdAt and updatedAt for approved tramites)
      const approvedTramites = tramites.filter((t: any) => t.estatus === 'aprobado' && t.createdAt && t.updatedAt);
      let avgDays = 0;
      if (approvedTramites.length > 0) {
        const totalDays = approvedTramites.reduce((sum: number, t: any) => {
          const created = new Date(t.createdAt).getTime();
          const updated = new Date(t.updatedAt).getTime();
          return sum + (updated - created) / (1000 * 60 * 60 * 24);
        }, 0);
        avgDays = Math.round(totalDays / approvedTramites.length);
      }

      setMetrics({
        avgResolutionDays: avgDays,
        totalClientes,
        totalIngresosMes: currentMonthRevenue,
        conversionRate,
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="h-40 rounded-2xl bg-gradient-to-tl from-neutral-900 via-stone-800 to-amber-600 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="dark-card-static p-6 animate-pulse">
              <div className="h-4 bg-[#262626] rounded w-24 mb-4" />
              <div className="h-8 bg-[#262626] rounded w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="dark-card-static p-6 h-80 animate-pulse" />
          <div className="dark-card-static p-6 h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-neutral-900 via-stone-800 to-amber-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-amber-200 mt-1">Métricas de rendimiento y análisis de datos</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Ingresos del Mes"
          value={formatCurrency(metrics.totalIngresosMes)}
          icon={<DollarSign className="h-5 w-5" />}
          color="from-green-500 to-emerald-600"
          trend="+15%"
          trendUp
        />
        <MetricCard
          title="Tiempo Promedio Resolución"
          value={`${metrics.avgResolutionDays} días`}
          icon={<Clock className="h-5 w-5" />}
          color="from-blue-500 to-amber-600"
          trend="-2 días"
          trendUp
        />
        <MetricCard
          title="Tasa de Conversión"
          value={`${metrics.conversionRate}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="from-amber-500 to-amber-600"
          trend="+5%"
          trendUp
        />
        <MetricCard
          title="Total Clientes"
          value={metrics.totalClientes.toString()}
          icon={<Users className="h-5 w-5" />}
          color="from-purple-500 to-purple-600"
          trend="+12"
          trendUp
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Line Chart */}
        <div className="dark-card-static p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Ingresos Mensuales</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke={CHART_COLORS.green}
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS.green, strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tramites by Type Bar Chart */}
        <div className="dark-card-static p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <BarChart3 className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-white">Trámites por Tipo</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tramiteTypes} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="tipo" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                  formatter={(value: number) => [value, 'Trámites']}
                />
                <Bar dataKey="cantidad" radius={[8, 8, 0, 0]}>
                  {tramiteTypes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="dark-card-static p-6 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Filter className="h-4 w-4 text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Embudo de Conversión</h2>
          <span className="text-xs text-white/30 ml-2">Borrador → Recibido → En Revisión → Aprobado</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {funnelData.map((stage, index) => {
            const colors = [
              { bg: 'bg-[#1f1f1f]', text: 'text-white/70', bar: 'bg-gray-400' },
              { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500' },
              { bg: 'bg-amber-500/10', text: 'text-amber-700', bar: 'bg-amber-500' },
              { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-green-500' },
            ];
            const color = colors[index];
            return (
              <div key={stage.etapa} className="relative">
                <div className={`${color.bg} rounded-xl p-5 text-center`}>
                  <p className={`text-sm font-medium ${color.text} mb-1`}>{stage.etapa}</p>
                  <p className="text-3xl font-bold text-white">{stage.cantidad}</p>
                  <p className="text-xs text-white/40 mt-1">{stage.porcentaje}% del total</p>
                  <div className="mt-3 h-2 bg-[#1f1f1f] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color.bar} rounded-full transition-all duration-700`}
                      style={{ width: `${stage.porcentaje}%` }}
                    />
                  </div>
                </div>
                {index < funnelData.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <div className="w-4 h-4 text-white/20">→</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pie Chart + Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart - Status Distribution */}
        <div className="lg:col-span-1 dark-card-static p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Distribución</h2>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={funnelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="cantidad"
                  nameKey="etapa"
                >
                  {funnelData.map((_, index) => (
                    <Cell key={`pie-${index}`} fill={Object.values(CHART_COLORS)[index % 5]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #333', background: '#1a1a1a', color: '#fff' }}
                  formatter={(value: number, name: string) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {funnelData.map((item, index) => (
              <div key={item.etapa} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: Object.values(CHART_COLORS)[index % 5] }} />
                  <span className="text-white/60">{item.etapa}</span>
                </div>
                <span className="font-semibold text-white">{item.cantidad}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resolution Time Breakdown */}
        <div className="lg:col-span-2 dark-card-static p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
            <h2 className="text-lg font-bold text-white">Métricas de Resolución</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResolutionCard
              label="Tiempo Promedio"
              value={`${metrics.avgResolutionDays} días`}
              description="Desde borrador hasta aprobado"
              color="from-blue-500 to-amber-600"
            />
            <ResolutionCard
              label="Tasa de Aprobación"
              value={`${metrics.conversionRate}%`}
              description="Trámites aprobados del total"
              color="from-green-500 to-emerald-600"
            />
            <ResolutionCard
              label="Clientes Activos"
              value={metrics.totalClientes.toString()}
              description="Clientes registrados en el sistema"
              color="from-purple-500 to-purple-600"
            />
            <ResolutionCard
              label="Ingreso Mensual"
              value={formatCurrency(metrics.totalIngresosMes)}
              description="Total facturado este mes"
              color="from-amber-500 to-amber-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
  trend,
  trendUp,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-white/40">{title}</p>
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg`}>
            {icon}
          </div>
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trendUp ? (
              <ArrowUpRight className="h-3 w-3 text-green-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            )}
            <span className={`text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend} este mes
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ResolutionCard({
  label,
  value,
  description,
  color,
}: {
  label: string;
  value: string;
  description: string;
  color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border p-5 hover:shadow-md transition-all duration-300 group">
      <div
        className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${color}`}
      />
      <div className="pl-3">
        <p className="text-xs font-medium text-white/40 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-white mt-1">{value}</p>
        <p className="text-xs text-white/30 mt-1">{description}</p>
      </div>
    </div>
  );
}
