'use client';

import { Zap, Clock, Bell, XCircle, CheckCircle, Mail } from 'lucide-react';

const AUTOMATIZACIONES = [
  {
    id: 1,
    nombre: 'Cancelar trámites sin pago',
    descripcion: 'Si el extranjero no paga el anticipo en 15 días, el trámite se cancela automáticamente.',
    icono: XCircle,
    color: 'text-red-500 bg-red-50',
    activa: true,
    frecuencia: 'Cada 24 horas',
  },
  {
    id: 2,
    nombre: 'Recordatorio de pago pendiente',
    descripcion: 'Envía notificación al extranjero 3 días antes de que venza el plazo de pago.',
    icono: Bell,
    color: 'text-yellow-500 bg-yellow-50',
    activa: true,
    frecuencia: 'Cada 24 horas',
  },
  {
    id: 3,
    nombre: 'Recordatorio de cita próxima',
    descripcion: 'Notifica al extranjero 2 días antes de su cita programada.',
    icono: Clock,
    color: 'text-blue-500 bg-blue-50',
    activa: true,
    frecuencia: 'Cada 24 horas',
  },
  {
    id: 4,
    nombre: 'Notificación de documento por vencer',
    descripcion: 'Alerta cuando un pasaporte o documento migratorio está por vencer (30 días antes).',
    icono: Bell,
    color: 'text-orange-500 bg-orange-50',
    activa: true,
    frecuencia: 'Cada 7 días',
  },
  {
    id: 5,
    nombre: 'Envío de requisitos por correo',
    descripcion: 'Al completar la solicitud INM, envía automáticamente los requisitos al extranjero por email.',
    icono: Mail,
    color: 'text-green-500 bg-green-50',
    activa: true,
    frecuencia: 'Al completar trámite',
  },
  {
    id: 6,
    nombre: 'Seguimiento de inactividad',
    descripcion: 'Si un trámite lleva más de 30 días sin movimiento, notifica al admin.',
    icono: Clock,
    color: 'text-purple-500 bg-purple-50',
    activa: false,
    frecuencia: 'Cada 7 días',
  },
];

export default function AutomatizacionesPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Zap className="h-6 w-6 text-brand-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automatizaciones</h1>
          <p className="text-sm text-gray-500">Reglas automáticas que mantienen el sistema funcionando</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AUTOMATIZACIONES.map((auto) => {
          const Icon = auto.icono;
          return (
            <div key={auto.id} className="bg-white rounded-xl border shadow-sm p-5">
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-lg ${auto.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{auto.nombre}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${auto.activa ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {auto.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{auto.descripcion}</p>
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {auto.frecuencia}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-sm text-blue-800"><strong>Nota:</strong> Las automatizaciones se ejecutan en segundo plano. Los pagos vencidos se cancelan automáticamente y las notificaciones se envían sin intervención manual.</p>
      </div>
    </div>
  );
}
