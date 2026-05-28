'use client';

import { useState } from 'react';
import { Settings, Building, Phone, Globe, Shield, Bell, CreditCard } from 'lucide-react';
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
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-brand-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500">Ajustes generales del sistema</p>
        </div>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Datos de la empresa */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-5 w-5 text-brand-500" />
            <h2 className="text-lg font-semibold text-gray-900">Datos de la Empresa</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Nombre de la empresa</label><input type="text" value={config.empresaNombre} onChange={e => setConfig(prev => ({ ...prev, empresaNombre: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Email de contacto</label><input type="email" value={config.empresaEmail} onChange={e => setConfig(prev => ({ ...prev, empresaEmail: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label><input type="text" value={config.empresaTelefono} onChange={e => setConfig(prev => ({ ...prev, empresaTelefono: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label><input type="text" value={config.empresaDireccion} onChange={e => setConfig(prev => ({ ...prev, empresaDireccion: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900">WhatsApp</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Número de WhatsApp (con código de país)</label><input type="text" value={config.whatsappNumero} onChange={e => setConfig(prev => ({ ...prev, whatsappNumero: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Mensaje predeterminado</label><input type="text" value={config.whatsappMensaje} onChange={e => setConfig(prev => ({ ...prev, whatsappMensaje: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
          </div>
        </div>

        {/* Pagos */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-brand-500" />
            <h2 className="text-lg font-semibold text-gray-900">Configuración de Pagos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Plazo anticipo (días)</label><input type="number" value={config.plazoAnticipo} onChange={e => setConfig(prev => ({ ...prev, plazoAnticipo: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Plazo liquidación (días)</label><input type="number" value={config.plazoLiquidacion} onChange={e => setConfig(prev => ({ ...prev, plazoLiquidacion: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">% Anticipo</label><input type="number" value={config.porcentajeAnticipo} onChange={e => setConfig(prev => ({ ...prev, porcentajeAnticipo: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-brand-500" />
            <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <span className="text-sm text-gray-700">Notificaciones push (app móvil)</span>
              <input type="checkbox" checked={config.notificacionesPush} onChange={e => setConfig(prev => ({ ...prev, notificacionesPush: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <span className="text-sm text-gray-700">Notificaciones por email</span>
              <input type="checkbox" checked={config.notificacionesEmail} onChange={e => setConfig(prev => ({ ...prev, notificacionesEmail: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <span className="text-sm text-gray-700">Notificaciones por WhatsApp</span>
              <input type="checkbox" checked={config.notificacionesWhatsapp} onChange={e => setConfig(prev => ({ ...prev, notificacionesWhatsapp: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
            </label>
          </div>
        </div>

        {/* Seguridad */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-brand-500" />
            <h2 className="text-lg font-semibold text-gray-900">Seguridad</h2>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✅ Tokens JWT con expiración de 15 minutos</p>
            <p>✅ Refresh token con rotación cada 4 horas</p>
            <p>✅ Bloqueo de cuenta después de 5 intentos fallidos</p>
            <p>✅ Cifrado de documentos con AES-256</p>
            <p>✅ HTTPS forzado + HSTS</p>
            <p>✅ Biometría (FaceID/Huella) en app móvil</p>
            <p>✅ Historial de pagos inmutable</p>
          </div>
        </div>

        <button onClick={handleSave} className="w-full px-6 py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors">
          Guardar configuración
        </button>
      </div>
    </div>
  );
}
