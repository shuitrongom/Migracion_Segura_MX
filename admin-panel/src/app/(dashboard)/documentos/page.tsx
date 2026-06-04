'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Eye, ChevronDown, ChevronRight, User, Download, Printer, X, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const ESTATUS_SOL: Record<string, { label: string; cls: string }> = {
  pendiente_revision: { label: 'Pendiente revisión', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  en_proceso: { label: 'En proceso', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  pendiente_pago: { label: 'Pendiente pago', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  pagada: { label: 'Pagada', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  cancelada: { label: 'Cancelada', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const ESTATUS_TRAMITE: Record<string, { label: string; cls: string }> = {
  borrador: { label: 'Borrador', cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  recibido: { label: 'Recibido', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  en_revision: { label: 'En revisión', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  aprobado: { label: 'Aprobado', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rechazado: { label: 'Rechazado', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

interface Extranjero {
  id: string;
  nombre: string;
  email: string;
  solicitudes: any[];
  tramites: any[];
}

export default function ExpedienteDigitalPage() {
  const [extranjeros, setExtranjeros] = useState<Extranjero[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Traer solicitudes (siempre existen si el extranjero usó la app)
      const solRes = await api.get('/solicitudes', { params: { page: 1, limit: 200 } });
      const solicitudes = solRes.data?.data || [];

      // Traer trámites
      const tramRes = await api.get('/tramites', { params: { page: 1, limit: 200 } });
      const tramites = tramRes.data?.data || [];

      // Traer clientes
      const cliRes = await api.get('/clientes', { params: { page: 1, limit: 200 } });
      const clientes = cliRes.data?.data || [];

      // Agrupar por clienteId
      const map = new Map<string, Extranjero>();

      for (const cli of clientes) {
        map.set(cli.id, {
          id: cli.id,
          nombre: cli.nombreCompleto || cli.nombre || 'Sin nombre',
          email: cli.email || '',
          solicitudes: [],
          tramites: [],
        });
      }

      for (const sol of solicitudes) {
        if (!sol.clienteId) continue;
        if (!map.has(sol.clienteId)) {
          const nombre = `${sol.datosFormulario?.nombre || ''} ${sol.datosFormulario?.apellidos || ''}`.trim() || 'Sin nombre';
          map.set(sol.clienteId, { id: sol.clienteId, nombre, email: sol.datosFormulario?.solicitanteEmail || '', solicitudes: [], tramites: [] });
        }
        map.get(sol.clienteId)!.solicitudes.push(sol);
      }

      for (const t of tramites) {
        if (!t.clienteId) continue;
        if (!map.has(t.clienteId)) {
          const nombre = `${t.datosFormulario?.nombre || ''} ${t.datosFormulario?.apellidos || ''}`.trim() || 'Sin nombre';
          map.set(t.clienteId, { id: t.clienteId, nombre, email: '', solicitudes: [], tramites: [] });
        }
        map.get(t.clienteId)!.tramites.push(t);
      }

      // Solo mostrar los que tienen al menos algo
      const result = Array.from(map.values()).filter(e => e.solicitudes.length > 0 || e.tramites.length > 0);
      result.sort((a, b) => (b.solicitudes.length + b.tramites.length) - (a.solicitudes.length + a.tramites.length));
      setExtranjeros(result);
    } catch (err) {
      console.error('Error cargando expediente:', err);
      setExtranjeros([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

  const filtered = search
    ? extranjeros.filter(e => e.nombre.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase()))
    : extranjeros;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-neutral-900 via-stone-800 to-amber-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Expediente Digital</h1>
            <p className="text-amber-200 mt-1">Solicitudes y trámites por extranjero</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{extranjeros.length}</p>
            <p className="text-amber-200 text-sm">Extranjeros</p>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="dark-card-static p-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-[#3a3a3a] rounded-xl text-sm bg-[#222222] text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {loading ? (
          <div className="dark-card-static p-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto mb-3" />
            <p className="text-sm text-white/50">Cargando expedientes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="dark-card-static p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-amber-400" />
            </div>
            <p className="text-white/70 font-medium">No se encontraron extranjeros</p>
            <p className="text-sm text-white/40 mt-1">Los extranjeros aparecen aquí cuando crean solicitudes o trámites desde la app</p>
          </div>
        ) : (
          filtered.map(ext => {
            const isExpanded = expandedId === ext.id;
            const totalItems = ext.solicitudes.length + ext.tramites.length;

            return (
              <div key={ext.id} className="dark-card-static overflow-hidden">
                {/* Header clickable */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : ext.id)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-[#1a1a1a] transition-colors text-left"
                >
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-amber-400">{ext.nombre.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{ext.nombre}</p>
                    <p className="text-xs text-white/40 truncate">{ext.email || 'Sin email'}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {ext.solicitudes.length > 0 && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {ext.solicitudes.length} solicitud{ext.solicitudes.length > 1 ? 'es' : ''}
                      </span>
                    )}
                    {ext.tramites.length > 0 && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {ext.tramites.length} trámite{ext.tramites.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {isExpanded ? <ChevronDown className="h-5 w-5 text-white/50" /> : <ChevronRight className="h-5 w-5 text-white/50" />}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-[#2a2a2a] bg-[#0f0f0f] p-5 space-y-4">
                    {/* Solicitudes */}
                    {ext.solicitudes.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">📋 Solicitudes</p>
                        <div className="space-y-2">
                          {ext.solicitudes.map((sol: any) => {
                            const est = ESTATUS_SOL[sol.estatus] || { label: sol.estatus, cls: 'bg-[#222] text-white/50 border-[#333]' };
                            return (
                              <div key={sol.id} className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-amber-500/20 transition-colors">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white">{(sol.tipoTramite || '').replace(/_/g, ' ')}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {sol.numeroPieza && <span className="text-[10px] font-mono text-amber-400">Pieza: {sol.numeroPieza}</span>}
                                    <span className="text-[10px] text-white/40">{formatDate(sol.createdAt)}</span>
                                    {sol.documentoUrl && <span className="text-[10px] text-emerald-400">📄 PDF disponible</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${est.cls}`}>{est.label}</span>
                                  <span className="text-xs font-bold text-white/70">${sol.costo || 100}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Trámites */}
                    {ext.tramites.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">🗂️ Trámites completos</p>
                        <div className="space-y-2">
                          {ext.tramites.map((t: any) => {
                            const est = ESTATUS_TRAMITE[t.estatus] || { label: t.estatus, cls: 'bg-[#222] text-white/50 border-[#333]' };
                            return (
                              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-blue-500/20 transition-colors">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white">{(t.tipo || '').replace(/_/g, ' ')}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {t.numeroPieza && <span className="text-[10px] font-mono text-blue-400">Pieza: {t.numeroPieza}</span>}
                                    <span className="text-[10px] text-white/40">{formatDate(t.createdAt)}</span>
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${est.cls}`}>{est.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
