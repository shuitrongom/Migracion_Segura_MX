'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

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
  inm: { label: 'Cita INM', color: 'bg-purple-50 text-purple-700' },
  entrevista: { label: 'Entrevista Gestor', color: 'bg-blue-50 text-blue-700' },
};

const ESTATUS_CITA_BADGE: Record<string, string> = {
  programada: 'bg-blue-50 text-blue-700',
  confirmada: 'bg-green-50 text-green-700',
  completada: 'bg-gray-50 text-gray-600',
  cancelada: 'bg-red-50 text-red-600',
  reagendada: 'bg-orange-50 text-orange-700',
};

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fecha || !form.hora) {
      toast.error('Fecha y hora son requeridos');
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
      toast.success('Cita creada exitosamente');
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
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Cargando citas...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header con botón agregar */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Citas programadas</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Nueva Cita
        </button>
      </div>

      {/* Formulario nueva cita */}
      {showForm && (
        <form onSubmit={handleCreate} className="p-4 border border-brand-200 rounded-lg bg-brand-50/30 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Agendar cita</p>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-gray-200"><X className="h-4 w-4 text-gray-500" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de cita *</label>
              <select value={form.tipo} onChange={e => setForm(prev => ({ ...prev, tipo: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="entrevista">Entrevista con Gestor</option>
                <option value="inm">Cita en el INM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Modalidad</label>
              <select value={form.modalidad} onChange={e => setForm(prev => ({ ...prev, modalidad: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="presencial">Presencial</option>
                <option value="videollamada">Videollamada</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha *</label>
              <input type="date" value={form.fecha} onChange={e => setForm(prev => ({ ...prev, fecha: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hora *</label>
              <input type="time" value={form.hora} onChange={e => setForm(prev => ({ ...prev, hora: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
            <input type="text" value={form.notas} onChange={e => setForm(prev => ({ ...prev, notas: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Observaciones..." />
          </div>
          <button type="submit" disabled={submitting} className="w-full px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50">
            {submitting ? 'Creando...' : 'Agendar Cita'}
          </button>
        </form>
      )}

      {/* Lista de citas */}
      {citas.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No hay citas registradas.</p>
          <p className="text-xs text-gray-300 mt-1">Las citas del INM y entrevistas con el gestor aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {citas.map(cita => {
            const tipoInfo = TIPO_CITA_LABELS[cita.tipo] || TIPO_CITA_LABELS.entrevista;
            return (
              <div key={cita.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${tipoInfo.color}`}>{tipoInfo.label}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${ESTATUS_CITA_BADGE[cita.estatus] || 'bg-gray-50 text-gray-600'}`}>{cita.estatus}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {formatDate(cita.fecha)} a las {cita.hora}
                      </p>
                      <p className="text-xs text-gray-500">
                        {cita.modalidad === 'videollamada' ? '📹 Videollamada' : '📍 Presencial'}
                        {cita.asesor && ` • ${cita.asesor.fullName}`}
                      </p>
                      {cita.notas && <p className="text-xs text-gray-400 mt-1">{cita.notas}</p>}
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
