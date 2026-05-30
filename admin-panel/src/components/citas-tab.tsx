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
  asesor?: { fullName: string } | null;
}

const TIPO_CITA_LABELS: Record<string, { label: string; color: string }> = {
  inm: { label: 'Cita INM', color: 'bg-purple-500/10 text-purple-400' },
  entrevista: { label: 'Entrevista Gestor', color: 'bg-blue-500/10 text-blue-400' },
};

const ESTATUS_CITA_BADGE: Record<string, string> = {
  programada: 'bg-blue-500/10 text-blue-400',
  confirmada: 'bg-emerald-500/10 text-emerald-400',
  completada: 'bg-[#141414] text-white/60',
  cancelada: 'bg-red-500/10 text-red-400',
  reagendada: 'bg-orange-500/10 text-orange-400',
};

// Horarios según tipo de cita
// INM: L-V 9:00 a 15:00 (sesión 1 hora)
// Gestor: L-V 9:00 a 19:00 (sesión 1 hora)
const HORARIOS_INM = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];
const HORARIOS_GESTOR = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export function CitasTab({ clienteId }: { clienteId: string }) {
  const { user } = useAuthStore();
  const [citas, setCitas] = useState<CitaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    tipo: 'entrevista',
    fecha: '',
    hora: '',
    modalidad: 'presencial',
    notas: '',
  });
  const [citasDelDia, setCitasDelDia] = useState<string[]>([]);

  useEffect(() => {
    fetchCitas();
  }, [clienteId]);

  const fetchCitas = async () => {
    try {
      const res = await api.get(`/citas/cliente/${clienteId}`);
      setCitas(res.data?.data || res.data || []);
    } catch {
      setCitas([]);
    } finally {
      setLoading(false);
    }
  };

  const getHorarios = () => form.tipo === 'inm' ? HORARIOS_INM : HORARIOS_GESTOR;

  // Fetch citas del día seleccionado para bloquear horarios ocupados
  useEffect(() => {
    if (!form.fecha) { setCitasDelDia([]); return; }
    api.get('/citas', { params: { fechaInicio: form.fecha, fechaFin: form.fecha, limit: 50 } })
      .then(res => {
        const data = res.data?.data || res.data || [];
        const horasOcupadas = data.map((c: { horaInicio?: string; hora?: string }) => c.horaInicio || c.hora || '');
        setCitasDelDia(horasOcupadas.filter(Boolean));
      })
      .catch(() => setCitasDelDia([]));
  }, [form.fecha]);

  const getHoraFin = (horaInicio: string) => {
    const [h] = horaInicio.split(':').map(Number);
    return `${String(h + 1).padStart(2, '0')}:00`;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fecha || !form.hora) {
      toast.error('Fecha y hora son requeridos');
      return;
    }

    // Validar que sea día hábil (L-V)
    const fecha = new Date(form.fecha + 'T12:00:00');
    const dia = fecha.getDay();
    if (dia === 0 || dia === 6) {
      toast.error('Solo se pueden agendar citas de lunes a viernes');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/citas', {
        clienteId,
        asesorId: user?.id,
        tipo: form.tipo,
        fecha: form.fecha,
        hora: form.hora,
        modalidad: form.modalidad,
        notas: form.notas || undefined,
      });

      // Enviar notificación por correo
      try {
        const clienteRes = await api.get(`/clientes/${clienteId}`);
        const clienteEmail = clienteRes.data?.email;
        const clienteNombre = clienteRes.data?.nombreCompleto;
        const clienteTelefono = clienteRes.data?.telefono;
        if (clienteEmail) {
          await api.post('/notificaciones/enviar-requisitos', {
            email: clienteEmail,
            nombreExtranjero: clienteNombre || 'Extranjero',
            requisitos: [`Cita agendada: ${form.tipo === 'inm' ? 'Cita en el INM' : 'Entrevista con Gestor'} el ${formatDate(form.fecha)} a las ${form.hora} hrs. Modalidad: ${form.modalidad}. ${form.notas || ''}`],
          });
        }
        // WhatsApp directo
        if (clienteTelefono && clienteTelefono !== 'pendiente') {
          const tel = clienteTelefono.replace(/\D/g, '');
          const msg = encodeURIComponent(`Hola ${clienteNombre}, tu cita ha sido agendada:\n📅 ${formatDate(form.fecha)}\n🕐 ${form.hora} hrs\n📍 ${form.tipo === 'inm' ? 'INM' : 'Oficina del Gestor'}\n${form.notas || ''}`);
          window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
        }
      } catch { /* no bloquear */ }

      toast.success('Cita agendada exitosamente');
      setShowForm(false);
      setForm({ tipo: 'entrevista', fecha: '', hora: '', modalidad: 'presencial', notas: '' });
      fetchCitas();
    } catch {
      toast.error('Error al crear la cita');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  if (loading) {
    return <div className="text-center py-8 text-white/30">Cargando citas...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white/70">Citas programadas</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Nueva Cita
        </button>
      </div>

      {/* Formulario nueva cita */}
      {showForm && (
        <form onSubmit={handleCreate} className="p-5 border-2 border-brand-200 rounded-xl bg-gradient-to-br from-amber-500/10/50 to-white space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-white">Agendar cita</p>
            <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-[#262626] transition-colors"><X className="h-4 w-4 text-white/40" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Tipo de cita *</label>
              <select value={form.tipo} onChange={e => setForm(prev => ({ ...prev, tipo: e.target.value, hora: '' }))} className="w-full px-3 py-2.5 border border-[#333333] bg-[#1a1a1a] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm">
                <option value="inm">Cita en el INM</option>
                <option value="entrevista">Entrevista con Gestor</option>
              </select>
              <p className="text-[10px] text-white/30 mt-1">{form.tipo === 'inm' ? 'L-V de 9:00 a 15:00' : 'L-V de 9:00 a 19:00'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Modalidad</label>
              <select value={form.modalidad} onChange={e => setForm(prev => ({ ...prev, modalidad: e.target.value }))} className="w-full px-3 py-2.5 border border-[#333333] bg-[#1a1a1a] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm">
                <option value="presencial">Presencial</option>
                <option value="videollamada">Videollamada</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Fecha * (solo L-V)</label>
              <DatePicker value={form.fecha} onChange={v => setForm(prev => ({ ...prev, fecha: v }))} yearRange={[2025, 2027]} disablePast disableWeekends />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Hora * (sesión de 1 hora)</label>
              {form.fecha && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-green-500"></span> Disponible</span>
                  <span className="inline-flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-yellow-500"></span> Pocas</span>
                  <span className="inline-flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-red-500"></span> Ocupado</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {getHorarios().map(h => {
                  const ocupado = citasDelDia.includes(h);
                  const totalSlots = getHorarios().length;
                  const ocupados = citasDelDia.length;
                  const porcentaje = totalSlots > 0 ? ocupados / totalSlots : 0;
                  const colorIndicator = ocupado ? 'bg-red-100 border-red-300 text-red-400 cursor-not-allowed' : porcentaje > 0.6 ? 'bg-amber-500/10 border-yellow-300 text-yellow-800 hover:bg-yellow-100' : 'bg-emerald-500/10 border-green-300 text-green-800 hover:bg-green-100';
                  const isSelected = form.hora === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={ocupado}
                      onClick={() => !ocupado && setForm(prev => ({ ...prev, hora: h }))}
                      className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${isSelected ? 'bg-amber-500 text-white border-amber-500 shadow-md' : colorIndicator}`}
                    >
                      {h} - {getHoraFin(h)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Notas</label>
            <input type="text" value={form.notas} onChange={e => setForm(prev => ({ ...prev, notas: e.target.value }))} className="w-full px-3 py-2.5 border border-[#333333] bg-[#1a1a1a] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm" placeholder="Observaciones..." />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Send className="h-3.5 w-3.5 text-white/30" />
            <p className="text-[10px] text-white/30">Se enviará confirmación por correo electrónico y WhatsApp al extranjero</p>
          </div>
          <button type="submit" disabled={submitting} className="w-full px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm">
            {submitting ? 'Agendando...' : 'Agendar Cita'}
          </button>
        </form>
      )}

      {/* Lista de citas */}
      {citas.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/30">No hay citas registradas.</p>
          <p className="text-xs text-white/20 mt-1">Las citas del INM y entrevistas con el gestor aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {citas.map(cita => {
            const tipoInfo = TIPO_CITA_LABELS[cita.tipo] || TIPO_CITA_LABELS.entrevista;
            return (
              <div key={cita.id} className="p-4 border rounded-xl hover:bg-[#141414] transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[#1f1f1f] rounded-xl flex items-center justify-center">
                      <Clock className="h-5 w-5 text-white/40" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${tipoInfo.color}`}>{tipoInfo.label}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${ESTATUS_CITA_BADGE[cita.estatus] || 'bg-[#141414] text-white/60'}`}>{cita.estatus}</span>
                      </div>
                      <p className="text-sm font-medium text-white mt-1">
                        {formatDate(cita.fecha)} a las {cita.hora?.slice(0, 5)}
                      </p>
                      <p className="text-xs text-white/40">
                        {cita.modalidad === 'videollamada' ? '📹 Videollamada' : '📍 Presencial'}
                        {cita.asesor?.fullName && ` • ${cita.asesor.fullName}`}
                      </p>
                      {cita.notas && <p className="text-xs text-white/30 mt-1">{cita.notas}</p>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
