'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, X, Clock, Send, Video, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { DatePicker } from '@/components/ui/date-picker';

interface CitaItem {
  id: string;
  tipo: string;
  fecha: string;
  hora: string;
  modalidad: string;
  estatus: string;
  notas: string | null;
  cliente?: { nombreCompleto: string } | null;
  asesor?: { fullName: string } | null;
}

const TIPO_CITA_LABELS: Record<string, { label: string; color: string }> = {
  inm: { label: 'Cita INM', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  entrevista: { label: 'Entrevista Gestor', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

const ESTATUS_BADGE: Record<string, string> = {
  programada: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  confirmada: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completada: 'bg-[#1f1f1f] text-white/60 border-[#2a2a2a]',
  cancelada: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const HORARIOS_INM = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];
const HORARIOS_GESTOR = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export default function CitasPage() {
  const { user } = useAuthStore();
  const [citas, setCitas] = useState<CitaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientes, setClientes] = useState<{ id: string; nombreCompleto: string }[]>([]);
  const [gestores, setGestores] = useState<{ id: string; fullName: string }[]>([]);
  const [citasDelDia, setCitasDelDia] = useState<string[]>([]);
  const [form, setForm] = useState({
    clienteId: '', gestorId: '', tipo: 'entrevista',
    fecha: '', hora: '', modalidad: 'presencial', notas: '',
  });

  useEffect(() => { fetchCitas(); fetchClientes(); fetchGestores(); }, []);

  const fetchCitas = async () => {
    try {
      const res = await api.get('/citas', { params: { limit: 50 } });
      setCitas(res.data?.data || res.data || []);
    } catch { setCitas([]); }
    finally { setLoading(false); }
  };

  const fetchClientes = async () => {
    try {
      const res = await api.get('/clientes', { params: { limit: 100 } });
      setClientes(res.data?.data || res.data || []);
    } catch { /* noop */ }
  };

  const fetchGestores = async () => {
    try {
      const res = await api.get('/users/asesores');
      setGestores(res.data || []);
    } catch { /* noop */ }
  };

  useEffect(() => {
    if (!form.fecha) { setCitasDelDia([]); return; }
    api.get('/citas', { params: { fechaInicio: form.fecha, fechaFin: form.fecha, limit: 50 } })
      .then(res => {
        const data = res.data?.data || res.data || [];
        setCitasDelDia(data.map((c: { hora?: string }) => c.hora || '').filter(Boolean));
      })
      .catch(() => setCitasDelDia([]));
  }, [form.fecha]);

  const getHorarios = () => form.tipo === 'inm' ? HORARIOS_INM : HORARIOS_GESTOR;
  const getHoraFin = (h: string) => { const [hr] = h.split(':').map(Number); return `${String(hr + 1).padStart(2, '0')}:00`; };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clienteId || !form.fecha || !form.hora) { toast.error('Completa extranjero, fecha y hora'); return; }
    setSubmitting(true);
    try {
      await api.post('/citas', {
        clienteId: form.clienteId, asesorId: form.gestorId || user?.id,
        tipo: form.tipo, fecha: form.fecha, hora: form.hora,
        modalidad: form.modalidad, notas: form.notas || undefined,
      });
      toast.success('Cita agendada exitosamente');
      setShowForm(false);
      setForm({ clienteId: '', gestorId: '', tipo: 'entrevista', fecha: '', hora: '', modalidad: 'presencial', notas: '' });
      fetchCitas();
    } catch { toast.error('Error al crear la cita'); }
    finally { setSubmitting(false); }
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-neutral-900 via-stone-800 to-amber-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Citas</h1>
            <p className="text-amber-200 mt-1">Gestión de citas INM y entrevistas</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1f1f1f] backdrop-blur-sm text-white rounded-xl text-sm font-semibold hover:bg-[#171717]/30 transition-all border border-white/20"
          >
            <Plus className="h-4 w-4" /> Nueva Cita
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/40">Total Citas</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/30">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{citas.length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-amber-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/40">Programadas</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-amber-600 text-white shadow-lg shadow-blue-200/30">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{citas.filter(c => c.estatus === 'programada' || c.estatus === 'confirmada').length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/40">Completadas</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-200/30">
                <Video className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{citas.filter(c => c.estatus === 'completada').length}</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="dark-card-static p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10"><Plus className="h-4 w-4 text-emerald-400" /></div>
              <h2 className="text-lg font-bold text-white">Agendar Cita</h2>
            </div>
            <button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-[#1f1f1f] transition-colors"><X className="h-4 w-4 text-white/40" /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Extranjero *</label>
                <select value={form.clienteId} onChange={e => setForm(prev => ({ ...prev, clienteId: e.target.value }))} className="w-full px-4 py-2.5 border border-[#2a2a2a] bg-[#1a1a1a] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 capitalize transition-all">
                  <option value="">Selecciona</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombreCompleto}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Gestor asignado</label>
                <select value={form.gestorId} onChange={e => setForm(prev => ({ ...prev, gestorId: e.target.value }))} className="w-full px-4 py-2.5 border border-[#2a2a2a] bg-[#1a1a1a] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 capitalize transition-all">
                  <option value="">Automático (yo)</option>
                  {gestores.map(g => <option key={g.id} value={g.id}>{g.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Tipo de cita *</label>
                <select value={form.tipo} onChange={e => setForm(prev => ({ ...prev, tipo: e.target.value, hora: '' }))} className="w-full px-4 py-2.5 border border-[#2a2a2a] bg-[#1a1a1a] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all">
                  <option value="inm">Cita en el INM</option>
                  <option value="entrevista">Entrevista con Gestor</option>
                </select>
                <p className="text-[10px] text-white/30 mt-1">{form.tipo === 'inm' ? 'L-V de 9:00 a 15:00' : 'L-V de 9:00 a 19:00'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Modalidad</label>
                <select value={form.modalidad} onChange={e => setForm(prev => ({ ...prev, modalidad: e.target.value }))} className="w-full px-4 py-2.5 border border-[#2a2a2a] bg-[#1a1a1a] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all">
                  <option value="presencial">Presencial (en oficina)</option>
                  <option value="videollamada">Videollamada</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Fecha * (solo L-V)</label>
                <DatePicker value={form.fecha} onChange={v => setForm(prev => ({ ...prev, fecha: v }))} yearRange={[2025, 2027]} disablePast disableWeekends />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Hora * (sesión de 1 hora)</label>
                {form.fecha && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-green-500"></span> Disponible</span>
                    <span className="inline-flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-yellow-500"></span> Pocas</span>
                    <span className="inline-flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-red-500"></span> Ocupado</span>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {getHorarios().map(h => {
                    const ocupado = citasDelDia.includes(h);
                    const totalSlots = getHorarios().length;
                    const ocupados = citasDelDia.length;
                    const porcentaje = totalSlots > 0 ? ocupados / totalSlots : 0;
                    const colorIndicator = ocupado ? 'bg-red-500/10 border-red-500/30 text-red-400/70 cursor-not-allowed' : porcentaje > 0.6 ? 'bg-amber-500/10 border-yellow-300 text-yellow-800 hover:bg-amber-500/10' : 'bg-emerald-500/10 border-emerald-500/30 text-green-800 hover:bg-emerald-500/10';
                    const isSelected = form.hora === h;
                    return (
                      <button key={h} type="button" disabled={ocupado} onClick={() => !ocupado && setForm(prev => ({ ...prev, hora: h }))} className={`px-2 py-2 rounded-xl text-xs font-medium border transition-all ${isSelected ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-500 shadow-md' : colorIndicator}`}>
                        {h} - {getHoraFin(h)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Notas</label>
              <input type="text" value={form.notas} onChange={e => setForm(prev => ({ ...prev, notas: e.target.value }))} className="w-full px-4 py-2.5 border border-[#2a2a2a] bg-[#1a1a1a] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" placeholder="Observaciones..." />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2"><Send className="h-3.5 w-3.5 text-white/30" /><p className="text-[10px] text-white/30">Se enviará confirmación por correo y WhatsApp</p></div>
              <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 shadow-lg shadow-green-200/30 transition-all">{submitting ? 'Agendando...' : 'Agendar Cita'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de citas */}
      <div className="dark-card-static overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 px-6 py-4 border-b">
          <div className="p-2 rounded-lg bg-emerald-500/10"><Calendar className="h-4 w-4 text-emerald-400" /></div>
          <h2 className="text-lg font-bold text-white">Citas Agendadas</h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-[#141414]">
                <div className="h-11 w-11 rounded-xl bg-[#262626] animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-[#262626] rounded animate-pulse" />
                  <div className="h-3 w-56 bg-[#262626] rounded animate-pulse" />
                </div>
                <div className="h-6 w-20 bg-[#262626] rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : citas.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-white/40 font-medium">No hay citas registradas</p>
            <p className="text-sm text-white/30 mt-1">Agenda la primera cita con el botón de arriba</p>
          </div>
        ) : (
          <div className="divide-y divide-[#262626]">
            {citas.map(cita => {
              const tipoInfo = TIPO_CITA_LABELS[cita.tipo] || TIPO_CITA_LABELS.entrevista;
              return (
                <div key={cita.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#1f1f1f] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Clock className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${tipoInfo.color}`}>{tipoInfo.label}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${ESTATUS_BADGE[cita.estatus] || 'bg-[#141414] text-white/60 border-[#2a2a2a]'}`}>{cita.estatus}</span>
                      </div>
                      <p className="text-sm font-semibold text-white">{formatDate(cita.fecha)} a las {cita.hora?.slice(0, 5)}</p>
                      <p className="text-xs text-white/40 capitalize">
                        {cita.cliente?.nombreCompleto || 'Sin asignar'}
                        {cita.asesor?.fullName && ` • ${cita.asesor.fullName}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg ${cita.modalidad === 'videollamada' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {cita.modalidad === 'videollamada' ? <><Video className="h-3 w-3" /> Video</> : <><Building2 className="h-3 w-3" /> Oficina</>}
                    </span>
                    {cita.notas && <p className="text-xs text-white/30 max-w-[150px] truncate hidden lg:block">{cita.notas}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
