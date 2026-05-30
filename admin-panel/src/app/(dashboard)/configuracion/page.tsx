'use client';

import { useState } from 'react';
import { Settings, Building, Phone, Shield, Bell, CreditCard, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfiguracionPage() {
  const [config, setConfig] = useState({
    empresaNombre: 'Migración Segura MX',
    empresaEmail: 'admin@migracion-segura.mx',
    empresaTelefono: '+5215653173104',
    empresaDireccion: 'Ciudad de México, México',
    whatsappNumero: '5215653173104',
    whatsappMensaje: 'Hola, necesito ayuda con mi trámite migratorio.',
    plazoAnticipo: '15',
    plazoLiquidacion: '15',
    porcentajeAnticipo: '50',
    notificacionesPush: true,
    notificacionesEmail: true,
    notificacionesWhatsapp: false,
  });

  const handleSave = () => {
    toast.success('Configuración guardada exitosamente');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-gray-900 via-stone-800 to-amber-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-amber-200 mt-1">Ajustes generales del sistema</p>
        </div>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Datos de la empresa */}
        <div className="dark-card-static p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-amber-500/10"><Building className="h-4 w-4 text-amber-500" /></div>
            <h2 className="text-lg font-bold text-white">Datos de la Empresa</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-white/60 mb-1.5">Nombre de la empresa</label><input type="text" value={config.empresaNombre} onChange={e => setConfig(prev => ({ ...prev, empresaNombre: e.target.value }))} className="w-full px-4 py-2.5 border border-[#2a2a2a] rounded-xl text-sm bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1.5">Email de contacto</label><input type="email" value={config.empresaEmail} onChange={e => setConfig(prev => ({ ...prev, empresaEmail: e.target.value }))} className="w-full px-4 py-2.5 border border-[#2a2a2a] rounded-xl text-sm bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1.5">Teléfono</label><input type="text" value={config.empresaTelefono} onChange={e => setConfig(prev => ({ ...prev, empresaTelefono: e.target.value }))} className="w-full px-4 py-2.5 border border-[#2a2a2a] rounded-xl text-sm bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1.5">Dirección</label><input type="text" value={config.empresaDireccion} onChange={e => setConfig(prev => ({ ...prev, empresaDireccion: e.target.value }))} className="w-full px-4 py-2.5 border border-[#2a2a2a] rounded-xl text-sm bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" /></div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="dark-card-static p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-emerald-500/10"><Phone className="h-4 w-4 text-emerald-400" /></div>
            <h2 className="text-lg font-bold text-white">WhatsApp</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-white/60 mb-1.5">Número de WhatsApp (con código de país)</label><input type="text" value={config.whatsappNumero} onChange={e => setConfig(prev => ({ ...prev, whatsappNumero: e.target.value }))} className="w-full px-4 py-2.5 border border-[#2a2a2a] rounded-xl text-sm bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1.5">Mensaje predeterminado</label><input type="text" value={config.whatsappMensaje} onChange={e => setConfig(prev => ({ ...prev, whatsappMensaje: e.target.value }))} className="w-full px-4 py-2.5 border border-[#2a2a2a] rounded-xl text-sm bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" /></div>
          </div>
        </div>

        {/* Pagos */}
        <div className="dark-card-static p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-amber-500/10"><CreditCard className="h-4 w-4 text-amber-600" /></div>
            <h2 className="text-lg font-bold text-white">Configuración de Pagos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-white/60 mb-1.5">Plazo anticipo (días)</label><input type="number" value={config.plazoAnticipo} onChange={e => setConfig(prev => ({ ...prev, plazoAnticipo: e.target.value }))} className="w-full px-4 py-2.5 border border-[#2a2a2a] rounded-xl text-sm bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1.5">Plazo liquidación (días)</label><input type="number" value={config.plazoLiquidacion} onChange={e => setConfig(prev => ({ ...prev, plazoLiquidacion: e.target.value }))} className="w-full px-4 py-2.5 border border-[#2a2a2a] rounded-xl text-sm bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" /></div>
            <div><label className="block text-xs font-medium text-white/60 mb-1.5">% Anticipo</label><input type="number" value={config.porcentajeAnticipo} onChange={e => setConfig(prev => ({ ...prev, porcentajeAnticipo: e.target.value }))} className="w-full px-4 py-2.5 border border-[#2a2a2a] rounded-xl text-sm bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" /></div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="dark-card-static p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-blue-500/10"><Bell className="h-4 w-4 text-blue-400" /></div>
            <h2 className="text-lg font-bold text-white">Notificaciones</h2>
          </div>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-4 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-white border border-transparent hover:border-[#2a2a2a] cursor-pointer transition-all">
              <span className="text-sm font-medium text-white/70">Notificaciones push (app móvil)</span>
              <input type="checkbox" checked={config.notificacionesPush} onChange={e => setConfig(prev => ({ ...prev, notificacionesPush: e.target.checked }))} className="h-4 w-4 rounded border-[#333333] text-amber-500 focus:ring-amber-500" />
            </label>
            <label className="flex items-center justify-between p-4 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-white border border-transparent hover:border-[#2a2a2a] cursor-pointer transition-all">
              <span className="text-sm font-medium text-white/70">Notificaciones por email</span>
              <input type="checkbox" checked={config.notificacionesEmail} onChange={e => setConfig(prev => ({ ...prev, notificacionesEmail: e.target.checked }))} className="h-4 w-4 rounded border-[#333333] text-amber-500 focus:ring-amber-500" />
            </label>
            <label className="flex items-center justify-between p-4 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-white border border-transparent hover:border-[#2a2a2a] cursor-pointer transition-all">
              <span className="text-sm font-medium text-white/70">Notificaciones por WhatsApp</span>
              <input type="checkbox" checked={config.notificacionesWhatsapp} onChange={e => setConfig(prev => ({ ...prev, notificacionesWhatsapp: e.target.checked }))} className="h-4 w-4 rounded border-[#333333] text-amber-500 focus:ring-amber-500" />
            </label>
          </div>
        </div>

        {/* Seguridad */}
        <div className="dark-card-static p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-purple-500/10"><Shield className="h-4 w-4 text-purple-600" /></div>
            <h2 className="text-lg font-bold text-white">Seguridad</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Tokens JWT con expiración de 15 minutos',
              'Refresh token con rotación cada 4 horas',
              'Bloqueo de cuenta después de 5 intentos fallidos',
              'Cifrado de documentos con AES-256',
              'HTTPS forzado + HSTS',
              'Biometría (FaceID/Huella) en app móvil',
              'Historial de pagos inmutable',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-sm text-white/70 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Botón guardar */}
        <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl font-semibold hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-amber-500/20/30 hover:shadow-xl hover:-translate-y-0.5">
          <Save className="h-5 w-5" /> Guardar configuración
        </button>
      </div>
    </div>
  );
}
