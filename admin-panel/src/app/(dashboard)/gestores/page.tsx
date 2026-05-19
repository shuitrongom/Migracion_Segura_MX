'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserCog, Plus, Trash2, X, Eye, EyeOff, Camera } from 'lucide-react';
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
    fullName: '',
    email: '',
    phone: '',
    password: '',
    sexo: '',
    fechaNacimiento: '',
    curp: '',
    rfc: '',
    direccion: '',
  });

  const fetchGestores = useCallback(async () => {
    try {
      const response = await api.get('/users/asesores');
      setGestores(response.data);
    } catch {
      toast.error('Error al cargar Gestores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGestores();
  }, [fetchGestores]);

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
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
      });

      toast.success('Gestor creado. Se envió email con sus credenciales.');

      // Si el backend devuelve un link de WhatsApp, abrirlo
      if (response.data?.whatsappUrl) {
        window.open(response.data.whatsappUrl, '_blank');
      }

      setShowModal(false);
      setFormData({ fullName: '', email: '', phone: '', password: '', sexo: '', fechaNacimiento: '', curp: '', rfc: '', direccion: '' });
      setShowPassword(false);
      fetchGestores();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error al crear Gestor';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
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
    } catch {
      toast.error('Error al eliminar Gestor');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserCog className="h-6 w-6 text-brand-500" />
          <h1 className="text-2xl font-bold text-gray-900">Gestores</h1>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormData(prev => ({ ...prev, password: generatePassword() })); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Gestor
        </button>
      </div>

      {/* Lista de Gestores */}
      <div className="bg-white rounded-xl border shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando...</div>
        ) : Gestores.length === 0 ? (
          <div className="p-12 text-center">
            <UserCog className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay Gestores registrados.</p>
            <p className="text-sm text-gray-400 mt-1">
              Crea el primer Gestor para poder asignarlos a clientes y trámites.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Foto
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Nombre
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Gestores.map((Gestor) => {
                const canChangePhoto = isAdmin || user?.id === Gestor.id;
                return (
                <tr key={Gestor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="relative group">
                      {Gestor.profilePhotoUrl ? (
                        <img src={Gestor.profilePhotoUrl} alt={Gestor.fullName || ''} className="h-10 w-10 rounded-xl object-cover border border-gray-200" />
                      ) : (
                        <div className="h-10 w-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center">
                          <span className="text-sm font-bold text-white">{(Gestor.fullName || '?').charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      {canChangePhoto && (
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Camera className="h-4 w-4 text-white" />
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const formData = new FormData();
                              formData.append('file', file);
                              await api.post(`/users/${Gestor.id}/foto`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                              toast.success('Foto actualizada');
                              fetchGestores();
                            } catch { toast.error('Error al subir foto'); }
                          }} />
                        </label>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <a href={`/gestores/${Gestor.id}`} className="text-brand-600 hover:text-brand-700 hover:underline font-medium capitalize">
                      {Gestor.fullName || '—'}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{Gestor.email}</td>
                  <td className="px-6 py-4 text-right">
                    {isAdmin && (
                    <button
                      onClick={() => handleDelete(Gestor.id, Gestor.fullName)}
                      className="p-2 text-gray-400 hover:text-danger-500 rounded-lg hover:bg-danger-50 transition-colors"
                      aria-label={`Eliminar Gestor ${Gestor.fullName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear Gestor */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Nuevo Gestor</h2>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                  <input id="fullName" type="text" value={formData.fullName} onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Nombre y apellidos" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
                  <input id="email" type="email" autoComplete="new-email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="correo@ejemplo.com" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                  <input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="+52 55 1234 5678" />
                </div>
                <div>
                  <label htmlFor="sexo" className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                  <select id="sexo" value={formData.sexo} onChange={(e) => setFormData((prev) => ({ ...prev, sexo: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">Selecciona</option>
                    <option value="H">Hombre</option>
                    <option value="M">Mujer</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
                  <DatePicker value={formData.fechaNacimiento} onChange={(v) => setFormData((prev) => ({ ...prev, fechaNacimiento: v }))} yearRange={[1960, 2005]} />
                </div>
                <div>
                  <label htmlFor="curp" className="block text-sm font-medium text-gray-700 mb-1">CURP</label>
                  <input id="curp" type="text" value={formData.curp} onChange={(e) => setFormData((prev) => ({ ...prev, curp: e.target.value.toUpperCase() }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="18 caracteres" maxLength={18} />
                </div>
                <div>
                  <label htmlFor="rfc" className="block text-sm font-medium text-gray-700 mb-1">RFC</label>
                  <input id="rfc" type="text" value={formData.rfc} onChange={(e) => setFormData((prev) => ({ ...prev, rfc: e.target.value.toUpperCase() }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="13 caracteres" maxLength={13} />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input id="direccion" type="text" value={formData.direccion} onChange={(e) => setFormData((prev) => ({ ...prev, direccion: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Calle, número, colonia, ciudad" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña temporal *</label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))} className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Mínimo 8 caracteres" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600" aria-label={showPassword ? 'Ocultar' : 'Mostrar'}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">Se enviará por correo y WhatsApp al Gestor.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50">
                  {submitting ? 'Creando...' : 'Crear Gestor'}
                </button>
                <button type="button" onClick={handleCloseModal} className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal detalle/editar gestor */}
      {selectedGestor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedGestor(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Información del Gestor</h2>
              <button onClick={() => setSelectedGestor(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="h-14 w-14 bg-brand-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-brand-600">{(selectedGestor.fullName || '?').charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{selectedGestor.fullName || '—'}</p>
                  <p className="text-sm text-gray-500">{selectedGestor.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Nombre completo</label>
                  <input type="text" defaultValue={selectedGestor.fullName || ''} id="edit-gestor-name" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Correo electrónico</label>
                  <input type="email" defaultValue={selectedGestor.email} id="edit-gestor-email" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-between">
              <button onClick={() => setSelectedGestor(null)} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cerrar</button>
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
                className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
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
