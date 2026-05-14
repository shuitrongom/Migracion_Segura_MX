'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';

interface FormData {
  nombreCompleto: string;
  email: string;
  telefono: string;
  asesorId: string;
  etiquetas: string[];
}

interface FormErrors {
  nombreCompleto?: string;
  email?: string;
  telefono?: string;
}

const ASESORES = [
  { id: 'asesor-1', nombre: 'Carlos Mendoza' },
  { id: 'asesor-2', nombre: 'Ana Rodríguez' },
  { id: 'asesor-3', nombre: 'Luis Hernández' },
];

export default function NuevoClientePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    nombreCompleto: '',
    email: '',
    telefono: '',
    asesorId: '',
    etiquetas: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nombreCompleto.trim()) {
      newErrors.nombreCompleto = 'El nombre es requerido';
    } else if (formData.nombreCompleto.trim().length < 2) {
      newErrors.nombreCompleto = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (formData.telefono.trim().length < 8) {
      newErrors.telefono = 'El teléfono debe tener al menos 8 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      router.push('/clientes');
    }, 1000);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !formData.etiquetas.includes(tag)) {
        setFormData((prev) => ({ ...prev, etiquetas: [...prev.etiquetas, tag] }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      etiquetas: prev.etiquetas.filter((t) => t !== tag),
    }));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/clientes"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          aria-label="Volver a clientes"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Cliente</h1>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
          {/* Nombre completo */}
          <div>
            <label htmlFor="nombreCompleto" className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre completo *
            </label>
            <input
              id="nombreCompleto"
              type="text"
              value={formData.nombreCompleto}
              onChange={(e) => setFormData((prev) => ({ ...prev, nombreCompleto: e.target.value }))}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                errors.nombreCompleto ? 'border-danger-500' : 'border-gray-200'
              }`}
              placeholder="Nombre(s) y apellido(s)"
            />
            {errors.nombreCompleto && (
              <p className="mt-1 text-sm text-danger-500">{errors.nombreCompleto}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Correo electrónico *
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                errors.email ? 'border-danger-500' : 'border-gray-200'
              }`}
              placeholder="correo@ejemplo.com"
            />
            {errors.email && <p className="mt-1 text-sm text-danger-500">{errors.email}</p>}
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1.5">
              Teléfono *
            </label>
            <input
              id="telefono"
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                errors.telefono ? 'border-danger-500' : 'border-gray-200'
              }`}
              placeholder="+52 55 1234 5678"
            />
            {errors.telefono && <p className="mt-1 text-sm text-danger-500">{errors.telefono}</p>}
          </div>

          {/* Asesor */}
          <div>
            <label htmlFor="asesorId" className="block text-sm font-medium text-gray-700 mb-1.5">
              Asesor asignado
            </label>
            <select
              id="asesorId"
              value={formData.asesorId}
              onChange={(e) => setFormData((prev) => ({ ...prev, asesorId: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Sin asignar</option>
              {ASESORES.map((asesor) => (
                <option key={asesor.id} value={asesor.id}>
                  {asesor.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Etiquetas */}
          <div>
            <label htmlFor="etiquetas" className="block text-sm font-medium text-gray-700 mb-1.5">
              Etiquetas
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.etiquetas.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-md text-xs font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-brand-900"
                    aria-label={`Eliminar etiqueta ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              id="etiquetas"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="Escribe y presiona Enter para agregar"
            />
            <p className="mt-1 text-xs text-gray-400">
              Presiona Enter o coma para agregar una etiqueta
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Guardando...' : 'Crear Cliente'}
            </button>
            <Link
              href="/clientes"
              className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
