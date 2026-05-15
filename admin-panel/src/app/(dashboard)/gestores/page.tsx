'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserCog, Plus, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Gestor {
  id: string;
  fullName: string | null;
  email: string;
}

export default function GestoresPage() {
  const [Gestores, setGestores] = useState<Gestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
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
      setFormData({ fullName: '', email: '', phone: '', password: '' });
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

  const handleCloseModal = () => {
    setShowModal(false);
    setShowPassword(false);
    setFormData({ fullName: '', email: '', phone: '', password: '' });
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
          onClick={() => setShowModal(true)}
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
              {Gestores.map((Gestor) => (
                <tr key={Gestor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {Gestor.fullName || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{Gestor.email}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(Gestor.id, Gestor.fullName)}
                      className="p-2 text-gray-400 hover:text-danger-500 rounded-lg hover:bg-danger-50 transition-colors"
                      aria-label={`Eliminar Gestor ${Gestor.fullName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear Gestor */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
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

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Nombre del Gestor"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico *
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono (para envío de WhatsApp)
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="+52 55 1234 5678"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña temporal *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Se enviará por correo y WhatsApp al Gestor. Podrá cambiarla después.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creando...' : 'Crear Gestor'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
