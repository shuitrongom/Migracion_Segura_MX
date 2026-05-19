'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, X, Clock, Send } from 'lucide-react';
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
  inm: { label: 'Cita INM', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  entrevista: { label: 'Entrevista Gestor', color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

const ESTATUS_BADGE: Record<string, string> = {
  programada: 'bg-blue-50 text-blue-700',
  confirmada: 'bg-green-50 text-green-700',
  completada: 'bg-gray-100 text-gray-600',
  cancelada: 'bg-red-50 text-red-600',
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
    clienteId: '',
    gestorId: '',
    tipo: 'entrevista',
    fecha: '',
    hora: '',
    modalidad: 'presencial',
    notas: '',
  });

  useEffect(() => { fetchCitas(); fetchClientes(); fetchGestores(); }, []);

  const fetchCitas = async () => {
    try {
      const res = await api.get('/citas', { params: { limit: 50 } });
      setCitas(res.data?.data || res.data || []);
    } catch (_e) { setCitas([]); }
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
        clienteId: form.clienteId,
        asesorId: form.gestorId || user?.id,
        tipo: form.tipo,
        fecha: form.fecha,
        hora: form.hora,
        modalidad: form.modalidad,
        notas: form.notas || undefined,
      });
      toast.success('Cita agendada exitosamente');
      setShowForm(false);
      setForm({ clienteId: '', gestorId: '', tipo: 'entrevista', fecha: '', hora: '', modalidad: 'presencial', notas: '' });
      fetchCitas();
    } catch (_e) { toast.error('Error al crear la cita'); }
    finally { setSubmitting(false); }
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-brand-500 to-purple-500 rounded-xl flex items-center justify-center shadow-sm">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
            <p className="text-xs text-gray-500">Gestión de citas INM y entrevistas</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors">
          <Plus className="h-4 w-4" /> Nueva Cita
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border shadow-sm p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-gray-900">Agendar cita</p>
            <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-200"><X className="h-4 w-4 text-gray-500" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Extranjero *</label>
              <select value={form.clienteId} onChange={e => setForm(prev => ({ ...prev, clienteId: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 bg-gray-50/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm capitalize">
                <option value="">Selecciona</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombreCompleto}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Gestor asignado</label>
              <select value={form.gestorId} onChange={e => setForm(prev => ({ ...prev, gestorId: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 bg-gray-50/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm capitalize">
                <option value="">Automático (yo)</option>
                {gestores.map(g => <option key={g.id} value={g.id}>{g.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de cita *</label>
              <select value={form.tipo} onChange={e => setForm(prev => ({ ...prev, tipo: e.target.value, hora: '' }))} className="w-full px-3 py-2.5 border border-gray-300 bg-gray-50/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm">
                <option value="inm">Cita en el INM</option>
                <option value="entrevista">Entrevista con Gestor</option>
              </select>
              <p className="text-[10px] text-gray-400 mt-1">{form.tipo === 'inm' ? 'L-V de 9:00 a 15:00' : 'L-V de 9:00 a 19:00'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Modalidad</label>
              <select value={form.modalidad} onChange={e => setForm(prev => ({ ...prev, modalidad: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 bg-gray-50/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm">
                <option value="presencial">Presencial</option>
                <option value="videollamada">Videollamada</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha * (solo L-V)</label>
              <DatePicker value={form.fecha} onChange={v => setForm(prev => ({ ...prev, fecha: v }))} yearRange={[2025, 2027]} disablePast disableWeekends />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hora * (sesión de 1 hora)</label>
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
                  const colorIndicator = ocupado ? 'bg-red-100 border-red-300 text-red-400 cursor-not-allowed' : porcentaje > 0.6 ? 'bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100' : 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100';
                  const isSelected = form.hora === h;
                  return (
                    <button key={h} type="button" disabled={ocupado} onClick={() => !ocupado && setForm(prev => ({ ...prev, hora: h }))} className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${isSelected ? 'bg-brand-500 text-white border-brand-500 shadow-md' : colorIndicator}`}>
                      {h} - {getHoraFin(h)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
            <input type="text" value={form.notas} onChange={e => setForm(prev => ({ ...prev, notas: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 bg-gray-50/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" placeholder="Observaciones..." />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2"><Send className="h-3.5 w-3.5 text-gray-400" /><p className="text-[10px] text-gray-400">Se enviará confirmación por correo y WhatsApp</p></div>
            <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 shadow-sm">{submitting ? 'Agendando...' : 'Agendar Cita'}</button>
          </div>
        </form>
      )}

      {/* Lista de citas */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando citas...</div>
        ) : citas.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No hay citas registradas</p>
            <p className="text-sm text-gray-400 mt-1">Agenda la primera cita con el botón de arriba</p>
          </div>
        ) : (
          <div className="divide-y">
            {citas.map(cita => {
              const tipoInfo = TIPO_CITA_LABELS[cita.tipo] || TIPO_CITA_LABELS.entrevista;
              return (
                <div key={cita.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 bg-gradient-to-br from-brand-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <Clock className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${tipoInfo.color}`}>{tipoInfo.label}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${ESTATUS_BADGE[cita.estatus] || 'bg-gray-50 text-gray-600'}`}>{cita.estatus}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(cita.fecha)} a las {cita.hora?.slice(0, 5)}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {cita.cliente?.nombreCompleto || 'Sin asignar'} • {cita.modalidad === 'videollamada' ? '📹 Videollamada' : '📍 Presencial'}
                        {cita.asesor?.fullName && ` • ${cita.asesor.fullName}`}
                      </p>
                    </div>
                  </div>
                  {cita.notas && <p className="text-xs text-gray-400 max-w-xs truncate hidden lg:block">{cita.notas}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
