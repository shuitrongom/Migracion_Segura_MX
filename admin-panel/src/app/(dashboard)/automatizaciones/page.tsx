'use client';

import { Zap, Clock, Bell, XCircle, Mail, Activity, CheckCircle } from 'lucide-react';

const AUTOMATIZACIONES = [
  { id: 1, nombre: 'Cancelar trámites sin pago', descripcion: 'Si el extranjero no paga el anticipo en 15 días, el trámite se cancela automáticamente.', icono: XCircle, color: 'from-red-500 to-red-600', bgColor: 'bg-red-500/10', activa: true, frecuencia: 'Cada 24 horas' },
  { id: 2, nombre: 'Recordatorio de pago pendiente', descripcion: 'Envía notificación al extranjero 3 días antes de que venza el plazo de pago.', icono: Bell, color: 'from-yellow-500 to-amber-600', bgColor: 'bg-amber-500/10', activa: true, frecuencia: 'Cada 24 horas' },
  { id: 3, nombre: 'Recordatorio de cita próxima', descripcion: 'Notifica al extranjero 2 días antes de su cita programada.', icono: Clock, color: 'from-blue-500 to-amber-600', bgColor: 'bg-blue-500/10', activa: true, frecuencia: 'Cada 24 horas' },
  { id: 4, nombre: 'Notificación de documento por vencer', descripcion: 'Alerta cuando un pasaporte o documento migratorio está por vencer (30 días antes).', icono: Bell, color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-500/10', activa: true, frecuencia: 'Cada 7 días' },
  { id: 5, nombre: 'Envío de requisitos por correo', descripcion: 'Al completar la solicitud INM, envía automáticamente los requisitos al extranjero por email.', icono: Mail, color: 'from-green-500 to-emerald-600', bgColor: 'bg-emerald-500/10', activa: true, frecuencia: 'Al completar trámite' },
  { id: 6, nombre: 'Seguimiento de inactividad', descripcion: 'Si un trámite lleva más de 30 días sin movimiento, notifica al admin.', icono: Clock, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-500/10', activa: false, frecuencia: 'Cada 7 días' },
];

export default function AutomatizacionesPage() {
  const activas = AUTOMATIZACIONES.filter(a => a.activa).length;
  const inactivas = AUTOMATIZACIONES.filter(a => !a.activa).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-stone-800 to-yellow-700 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">Automatizaciones</h1>
          <p className="text-amber-200 mt-1">Reglas automáticas que mantienen el sistema funcionando</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-500 to-amber-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/40">Total Reglas</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-amber-600 text-white shadow-lg shadow-amber-500/20/30">
                <Zap className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{AUTOMATIZACIONES.length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/40">Activas</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/30">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{activas}</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/40">Inactivas</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-200/30">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{inactivas}</p>
          </div>
        </div>
      </div>

      {/* Lista de automatizaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {AUTOMATIZACIONES.map((auto) => {
          const Icon = auto.icono;
          return (
            <div key={auto.id} className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${auto.color} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`} />
              <div className="relative z-10 flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${auto.color} text-white shadow-lg shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-white">{auto.nombre}</h3>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${auto.activa ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#1f1f1f] text-white/40 border-[#2a2a2a]'}`}>
                      {auto.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="text-sm text-white/40 mt-1">{auto.descripcion}</p>
                  <div className="flex items-center gap-1.5 mt-3">
                    <Clock className="h-3 w-3 text-white/30" />
                    <p className="text-xs font-medium text-white/30">{auto.frecuencia}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nota informativa */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-500/20 p-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-start gap-3">
          <Zap className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800"><strong>Nota:</strong> Las automatizaciones se ejecutan en segundo plano. Los pagos vencidos se cancelan automáticamente y las notificaciones se envían sin intervención manual.</p>
        </div>
      </div>
    </div>
  );
}
