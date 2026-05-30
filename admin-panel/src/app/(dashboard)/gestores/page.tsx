'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserCog, Plus, Trash2, X, Eye, EyeOff, Camera, Shield, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { DatePicker } from '@/components/ui/date-picker';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/lib/types';

interface Gestor {
  id: string;
  fullName: string | null;
  email: string;
  profilePhotoUrl?: string | null;
}

export default function GestoresPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === UserRole.ADMINISTRADOR;
  const [Gestores, setGestores] = useState<Gestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedGestor, setSelectedGestor] = useState<Gestor | null>(null);
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', password: '',
    sexo: '', fechaNacimiento: '', curp: '', rfc: '', direccion: '',
  });

  const fetchGestores = useCallback(async () => {
    try {
      const response = await api.get('/users/asesores');
      setGestores(response.data);
    } catch { toast.error('Error al cargar Gestores'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGestores(); }, [fetchGestores]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('Nombre, email y contraseña son requeridos');
      return;
    }
    setSubmitting(true);
    try {
      const response = await api.post('/users/asesores', {
        fullName: formData.fullName, email: formData.email,
        phone: formData.phone || undefined, password: formData.password,
      });
      toast.success('Gestor creado. Se envió email con sus credenciales.');
      if (response.data?.whatsappUrl) window.open(response.data.whatsappUrl, '_blank');
      setShowModal(false);
      setFormData({ fullName: '', email: '', phone: '', password: '', sexo: '', fechaNacimiento: '', curp: '', rfc: '', direccion: '' });
      setShowPassword(false);
      fetchGestores();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al crear Gestor');
    } finally { setSubmitting(false); }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return pass;
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowPassword(false);
    setFormData({ fullName: '', email: '', phone: '', password: '', sexo: '', fechaNacimiento: '', curp: '', rfc: '', direccion: '' });
  };

  const handleDelete = async (id: string, name: string | null) => {
    if (!confirm(`¿Estás seguro de eliminar al Gestor ${name || 'sin nombre'}?`)) return;
    try {
      await api.delete(`/users/asesores/${id}`);
      toast.success('Gestor eliminado');
      fetchGestores();
    } catch { toast.error('Error al eliminar Gestor'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-neutral-900 via-stone-800 to-amber-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestores</h1>
            <p className="text-amber-200 mt-1">Equipo de gestores migratorios</p>
          </div>
          <button
            onClick={() => { setShowModal(true); setFormData(prev => ({ ...prev, password: generatePassword() })); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#222222] backdrop-blur-sm text-white rounded-xl text-sm font-semibold hover:bg-[#171717]/30 transition-all border border-white/20"
          >
            <Plus className="h-4 w-4" /> Nuevo Gestor
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500 to-purple-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/70">Total Gestores</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-purple-600 text-white shadow-lg shadow-amber-500/20/30">
                <UserCog className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{Gestores.length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/70">Activos</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/30">
                <Shield className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{Gestores.length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/70">Rol</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200/30">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xl font-bold text-white">Asesor Migratorio</p>
          </div>
        </div>
      </div>

      {/* Lista de Gestores */}
      <div className="dark-card-static overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 px-6 py-4 border-b">
          <div className="p-2 rounded-lg bg-amber-500/10"><UserCog className="h-4 w-4 text-amber-500" /></div>
          <h2 className="text-lg font-bold text-white">Equipo de Gestores</h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-[#1a1a1a]">
                <div className="h-11 w-11 rounded-full bg-[#262626] animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-[#262626] rounded animate-pulse" />
                  <div className="h-3 w-48 bg-[#262626] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : Gestores.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-100 flex items-center justify-center mx-auto mb-4">
              <UserCog className="h-8 w-8 text-amber-400/70" />
            </div>
            <p className="text-white/70 font-medium">No hay Gestores registrados</p>
            <p className="text-sm text-white/70 mt-1">Crea el primer Gestor para asignarlos a clientes y trámites.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#262626]">
            {Gestores.map((Gestor) => {
              const canChangePhoto = isAdmin || user?.id === Gestor.id;
              return (
                <div key={Gestor.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#222222] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="relative group/photo">
                      {Gestor.profilePhotoUrl ? (
                        <img src={Gestor.profilePhotoUrl} alt={Gestor.fullName || ''} className="h-11 w-11 rounded-full object-cover border-2 border-amber-500/20 group-hover:border-brand-300 transition-colors" />
                      ) : (
                        <div className="h-11 w-11 bg-gradient-to-br from-brand-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20/30">
                          <span className="text-sm font-bold text-white">{(Gestor.fullName || '?').charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      {canChangePhoto && (
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer">
                          <Camera className="h-4 w-4 text-white" />
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const fd = new FormData();
                              fd.append('file', file);
                              await api.post(`/users/${Gestor.id}/foto`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                              toast.success('Foto actualizada');
                              fetchGestores();
                            } catch { toast.error('Error al subir foto'); }
                          }} />
                        </label>
                      )}
                    </div>
                    <div>
                      <a href={`/gestores/${Gestor.id}`} className="text-sm font-semibold text-white hover:text-amber-500 capitalize transition-colors">
                        {Gestor.fullName || '—'}
                      </a>
                      <p className="text-xs text-white/70">{Gestor.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">Gestor</span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(Gestor.id, Gestor.fullName)}
                        className="p-2 text-white/70 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                        aria-label={`Eliminar Gestor ${Gestor.fullName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal crear Gestor */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#171717] rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-purple-600">
                  <Plus className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">Nuevo Gestor</h2>
              </div>
              <button onClick={handleCloseModal} className="p-2 rounded-lg hover:bg-[#222222] text-white/70 transition-colors" aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="fullName" className="block text-xs font-medium text-white/70 mb-1.5">Nombre completo *</label>
                  <input id="fullName" type="text" value={formData.fullName} onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))} className="w-full px-4 py-2.5 border border-[#3a3a3a] rounded-xl text-sm capitalize focus:outline-none focus:ring-2 focus:ring-amber-500 bg-[#222222] transition-all" placeholder="Nombre y apellidos" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-white/70 mb-1.5">Correo electrónico *</label>
                  <input id="email" type="email" autoComplete="new-email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} className="w-full px-4 py-2.5 border border-[#3a3a3a] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-[#222222] transition-all" placeholder="correo@ejemplo.com" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-medium text-white/70 mb-1.5">Teléfono *</label>
                  <input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} className="w-full px-4 py-2.5 border border-[#3a3a3a] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-[#222222] transition-all" placeholder="+52 55 1234 5678" />
                </div>
                <div>
                  <label htmlFor="sexo" className="block text-xs font-medium text-white/70 mb-1.5">Sexo</label>
                  <select id="sexo" value={formData.sexo} onChange={(e) => setFormData((prev) => ({ ...prev, sexo: e.target.value }))} className="w-full px-4 py-2.5 border border-[#3a3a3a] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-[#222222] transition-all">
                    <option value="">Selecciona</option>
                    <option value="H">Hombre</option>
                    <option value="M">Mujer</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="fechaNacimiento" className="block text-xs font-medium text-white/70 mb-1.5">Fecha de nacimiento</label>
                  <DatePicker value={formData.fechaNacimiento} onChange={(v) => setFormData((prev) => ({ ...prev, fechaNacimiento: v }))} yearRange={[1960, 2005]} />
                </div>
                <div>
                  <label htmlFor="curp" className="block text-xs font-medium text-white/70 mb-1.5">CURP</label>
                  <input id="curp" type="text" value={formData.curp} onChange={(e) => setFormData((prev) => ({ ...prev, curp: e.target.value.toUpperCase() }))} className="w-full px-4 py-2.5 border border-[#3a3a3a] rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 bg-[#222222] transition-all" placeholder="18 caracteres" maxLength={18} />
                </div>
                <div>
                  <label htmlFor="rfc" className="block text-xs font-medium text-white/70 mb-1.5">RFC</label>
                  <input id="rfc" type="text" value={formData.rfc} onChange={(e) => setFormData((prev) => ({ ...prev, rfc: e.target.value.toUpperCase() }))} className="w-full px-4 py-2.5 border border-[#3a3a3a] rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 bg-[#222222] transition-all" placeholder="13 caracteres" maxLength={13} />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="direccion" className="block text-xs font-medium text-white/70 mb-1.5">Dirección</label>
                  <input id="direccion" type="text" value={formData.direccion} onChange={(e) => setFormData((prev) => ({ ...prev, direccion: e.target.value }))} className="w-full px-4 py-2.5 border border-[#3a3a3a] rounded-xl text-sm capitalize focus:outline-none focus:ring-2 focus:ring-amber-500 bg-[#222222] transition-all" placeholder="Calle, número, colonia, ciudad" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-white/70 mb-1.5">Contraseña temporal *</label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))} className="w-full px-4 py-2.5 pr-12 border border-[#3a3a3a] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-[#222222] transition-all" placeholder="Mínimo 8 caracteres" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white/70" aria-label={showPassword ? 'Ocultar' : 'Mostrar'}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-white/70">Se enviará por correo y WhatsApp al Gestor.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-brand-600 text-white rounded-xl text-sm font-semibold hover:from-brand-600 hover:to-brand-700 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20/30">
                  {submitting ? 'Creando...' : 'Crear Gestor'}
                </button>
                <button type="button" onClick={handleCloseModal} className="px-4 py-2.5 border border-[#3a3a3a] text-white/70 rounded-xl text-sm font-medium hover:bg-[#1a1a1a] transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal detalle/editar gestor */}
      {selectedGestor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedGestor(null)}>
          <div className="bg-[#171717] rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-white">Información del Gestor</h2>
              <button onClick={() => setSelectedGestor(null)} className="p-2 rounded-lg hover:bg-[#222222] text-white/70 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="h-14 w-14 bg-gradient-to-br from-brand-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xl font-bold text-white">{(selectedGestor.fullName || '?').charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{selectedGestor.fullName || '—'}</p>
                  <p className="text-sm text-white/70">{selectedGestor.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-white/70 uppercase mb-1">Nombre completo</label>
                  <input type="text" defaultValue={selectedGestor.fullName || ''} id="edit-gestor-name" className="w-full px-4 py-2.5 border border-[#3a3a3a] rounded-xl text-sm capitalize focus:outline-none focus:ring-2 focus:ring-amber-500 bg-[#222222]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70 uppercase mb-1">Correo electrónico</label>
                  <input type="email" defaultValue={selectedGestor.email} id="edit-gestor-email" className="w-full px-4 py-2.5 border border-[#3a3a3a] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-[#222222]" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-between">
              <button onClick={() => setSelectedGestor(null)} className="px-4 py-2.5 border border-[#3a3a3a] text-white/70 rounded-xl text-sm font-medium hover:bg-[#1a1a1a] transition-colors">Cerrar</button>
              <button
                onClick={async () => {
                  const name = (document.getElementById('edit-gestor-name') as HTMLInputElement)?.value;
                  const email = (document.getElementById('edit-gestor-email') as HTMLInputElement)?.value;
                  if (!name || !email) return;
                  try {
                    await api.patch(`/auth/profile`, { fullName: name });
                    toast.success('Gestor actualizado');
                    setSelectedGestor(null);
                    fetchGestores();
                  } catch { toast.error('Error al actualizar'); }
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-brand-600 text-white rounded-xl text-sm font-semibold hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-amber-500/20/30 transition-all"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
