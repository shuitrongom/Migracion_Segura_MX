'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Camera, FileText, Calendar, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/lib/types';
import { capitalizeName } from '@/lib/utils';

interface GestorDetail {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  createdAt: string;
}

interface TramiteItem {
  id: string;
  tipo: string;
  estatus: string;
  numeroPieza: string | null;
  createdAt: string;
  cliente?: { nombreCompleto: string } | null;
}

interface CitaItem {
  id: string;
  tipo: string;
  fecha: string;
  hora: string;
  estatus: string;
  cliente?: { nombreCompleto: string } | null;
}

interface ClienteItem {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
}

const TIPO_LABELS: Record<string, string> = {
  visa: 'Visa', permiso_trabajo: 'Permisos INM', notificacion_cambio: 'Notificación Cambio',
  expedicion_documento: 'Expedición Documento', regularizacion_migratoria: 'Regularización',
  constancia_empleador: 'CIE', cambio_condicion_estancia: 'Cambio Condición',
};

const ESTATUS_BADGE: Record<string, string> = {
  recibido: 'bg-blue-500/10 text-blue-400', en_revision: 'bg-amber-500/10 text-amber-400',
  aprobado: 'bg-emerald-500/10 text-emerald-400', rechazado: 'bg-red-500/10 text-red-400',
  borrador: 'bg-[#1a1a1a] text-white/70', en_espera_resolucion: 'bg-orange-500/10 text-orange-400',
};

export default function GestorDetailPage() {
  const params = useParams();
  const gestorId = params.id as string;
  const { user } = useAuthStore();
  const isAdmin = user?.role === UserRole.ADMINISTRADOR;

  const [gestor, setGestor] = useState<GestorDetail | null>(null);
  const [tramites, setTramites] = useState<TramiteItem[]>([]);
  const [citas, setCitas] = useState<CitaItem[]>([]);
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tramites' | 'clientes' | 'citas'>('tramites');

  useEffect(() => {
    async function fetchData() {
      try {
        const [gestorRes, tramitesRes, citasRes, clientesRes] = await Promise.all([
          api.get(`/users/${gestorId}`).catch(() => ({ data: null })),
          api.get('/tramites', { params: { responsableId: gestorId, limit: 50 } }).catch(() => ({ data: { data: [] } })),
          api.get('/citas', { params: { asesorId: gestorId, limit: 50 } }).catch(() => ({ data: { data: [] } })),
          api.get('/clientes', { params: { asesorId: gestorId, limit: 50 } }).catch(() => ({ data: { data: [] } })),
        ]);
        setGestor(gestorRes.data);
        setTramites(tramitesRes.data?.data || tramitesRes.data || []);
        setCitas(citasRes.data?.data || citasRes.data || []);
        setClientes(clientesRes.data?.data || clientesRes.data || []);
      } catch { /* */ }
      finally { setLoading(false); }
    }
    fetchData();
  }, [gestorId]);

  const formatDate = (d: string) => new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-amber-500 animate-spin" /></div>;
  if (!gestor) return <div className="text-center py-20 text-white/70">Gestor no encontrado</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/gestores" className="p-2 rounded-xl hover:bg-amber-500/10 text-white/70 hover:text-amber-500 transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-white">Detalle del Gestor</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Perfil */}
        <div className="lg:col-span-1">
          <div className="dark-card-static overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-gray-50 to-brand-50/30 border-b">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  {gestor.profilePhotoUrl ? (
                    <img src={gestor.profilePhotoUrl} alt={gestor.fullName || ''} className="h-16 w-16 rounded-2xl object-cover border-2 border-white shadow-md" />
                  ) : (
                    <div className="h-16 w-16 bg-gradient-to-br from-amber-500 to-brand-700 rounded-2xl flex items-center justify-center shadow-md">
                      <span className="text-2xl font-bold text-white">{(gestor.fullName || '?').charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  {(isAdmin || user?.id === gestorId) && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="h-5 w-5 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          const res = await api.post(`/users/${gestorId}/foto`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                          setGestor(prev => prev ? { ...prev, profilePhotoUrl: res.data.profilePhotoUrl } : prev);
                          toast.success('Foto actualizada');
                        } catch { toast.error('Error al subir foto'); }
                      }} />
                    </label>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white capitalize">{gestor.fullName || '—'}</h2>
                  <p className="text-xs text-white/70">Gestor desde {formatDate(gestor.createdAt)}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl hover:bg-[#1a1a1a]">
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Email</p>
                <p className="text-sm font-medium text-white mt-0.5">{gestor.email}</p>
              </div>
              <div className="p-3 rounded-xl hover:bg-[#1a1a1a]">
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Teléfono</p>
                <p className="text-sm font-medium text-white mt-0.5">{gestor.phone || 'Sin registrar'}</p>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                <div className="text-center p-3 bg-amber-500/10 rounded-xl">
                  <p className="text-lg font-bold text-amber-500">{tramites.length}</p>
                  <p className="text-[10px] text-white/70">Trámites</p>
                </div>
                <div className="text-center p-3 bg-emerald-500/10 rounded-xl">
                  <p className="text-lg font-bold text-emerald-400">{clientes.length}</p>
                  <p className="text-[10px] text-white/70">Extranjeros</p>
                </div>
                <div className="text-center p-3 bg-purple-500/10 rounded-xl">
                  <p className="text-lg font-bold text-purple-400">{citas.length}</p>
                  <p className="text-[10px] text-white/70">Citas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Datos para solicitudes INM */}
          {isAdmin && (
            <div className="dark-card-static mt-4 p-5">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">🔑 Datos para solicitudes INM</p>
              <p className="text-[11px] text-white/50 mb-3">Estos datos se usan para auto-rellenar solicitudes ante el INM cuando el cliente lo autoriza.</p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const data = {
                  curp: (form.elements.namedItem('curp') as HTMLInputElement)?.value || '',
                  nacionalidad: (form.elements.namedItem('nacionalidad') as HTMLInputElement)?.value || '',
                  numeroPasaporte: (form.elements.namedItem('numeroPasaporte') as HTMLInputElement)?.value || '',
                  direccion: (form.elements.namedItem('direccion') as HTMLInputElement)?.value || '',
                };
                try {
                  await api.post(`/users/${gestorId}/metadata`, data);
                  toast.success('Datos del gestor actualizados');
                } catch { toast.error('Error al guardar'); }
              }} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-white/60 mb-1">CURP</label>
                  <input name="curp" type="text" className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#222222] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="18 caracteres" maxLength={18} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/60 mb-1">Nacionalidad</label>
                  <input name="nacionalidad" type="text" className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#222222] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="Mexicana" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/60 mb-1">Número de pasaporte</label>
                  <input name="numeroPasaporte" type="text" className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#222222] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="G12345678" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/60 mb-1">Dirección</label>
                  <input name="direccion" type="text" className="w-full px-3 py-2 border border-[#3a3a3a] bg-[#222222] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="Calle, Col., Ciudad" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors">
                  Guardar datos
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="lg:col-span-2">
          <div className="dark-card-static overflow-hidden">
            <div className="border-b px-2 pt-2">
              <nav className="flex gap-1">
                {[
                  { key: 'tramites' as const, label: 'Trámites', icon: FileText },
                  { key: 'clientes' as const, label: 'Extranjeros', icon: Users },
                  { key: 'citas' as const, label: 'Citas', icon: Calendar },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${activeTab === tab.key ? 'bg-[#171717] text-amber-500 border-2 border-b-0 border-brand-200 -mb-[2px]' : 'text-white/70 hover:text-amber-500 hover:bg-amber-500/10/50'}`}>
                    <tab.icon className="h-3.5 w-3.5" /> {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="p-6">
              {/* Trámites */}
              {activeTab === 'tramites' && (
                <div className="space-y-3">
                  {tramites.length === 0 ? (
                    <div className="text-center py-12"><FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-white/70">No tiene trámites asignados</p></div>
                  ) : tramites.map(t => (
                    <Link key={t.id} href={`/tramites/${t.id}`} className="block p-4 border-2 border-[#262626] rounded-xl hover:border-amber-500/30 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{TIPO_LABELS[t.tipo] || t.tipo}</p>
                          <p className="text-xs text-white/70 mt-0.5">{t.numeroPieza || 'Sin pieza'} • {capitalizeName(t.cliente?.nombreCompleto)} • {formatDate(t.createdAt)}</p>
                        </div>
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${ESTATUS_BADGE[t.estatus] || 'bg-[#1a1a1a] text-white/70'}`}>{t.estatus.replace(/_/g, ' ')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Extranjeros */}
              {activeTab === 'clientes' && (
                <div className="space-y-3">
                  {clientes.length === 0 ? (
                    <div className="text-center py-12"><Users className="h-10 w-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-white/70">No tiene extranjeros asignados</p></div>
                  ) : clientes.map(c => (
                    <Link key={c.id} href={`/clientes/${c.id}`} className="block p-4 border-2 border-[#262626] rounded-xl hover:border-amber-500/30 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center">
                          <span className="text-sm font-bold text-white">{(c.nombreCompleto || '?').charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white capitalize">{c.nombreCompleto}</p>
                          <p className="text-xs text-white/70">{c.email} • {c.telefono}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Citas */}
              {activeTab === 'citas' && (
                <div className="space-y-3">
                  {citas.length === 0 ? (
                    <div className="text-center py-12"><Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-white/70">No tiene citas registradas</p></div>
                  ) : citas.map(c => (
                    <div key={c.id} className="p-4 border-2 border-[#262626] rounded-xl hover:border-amber-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-purple-100 to-brand-100 rounded-xl flex items-center justify-center">
                            <Clock className="h-5 w-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{formatDate(c.fecha)} a las {c.hora}</p>
                            <p className="text-xs text-white/70 capitalize">{c.tipo === 'inm' ? 'Cita INM' : 'Entrevista'} • {capitalizeName(c.cliente?.nombreCompleto)}</p>
                          </div>
                        </div>
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${ESTATUS_BADGE[c.estatus] || 'bg-[#1a1a1a] text-white/70'}`}>{c.estatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
