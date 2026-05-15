'use client';

import { useState } from 'react';
import { DollarSign, Plus, X, TrendingUp, AlertCircle, Users } from 'lucide-react';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

export default function FinancieroPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-brand-500" />
          <h1 className="text-2xl font-bold text-gray-900">Módulo Financiero</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
          aria-label="Registrar pago"
        >
          <Plus className="h-4 w-4" />
          Registrar Pago
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Ingresos del Mes</p>
            <TrendingUp className="h-5 w-5 text-success-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(0)}</p>
          <p className="text-xs text-gray-400 mt-1">Sin datos disponibles</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Pagos Pendientes</p>
            <AlertCircle className="h-5 w-5 text-warning-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(0)}</p>
          <p className="text-xs text-gray-400 mt-1">Sin datos disponibles</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Clientes con Adeudo</p>
            <Users className="h-5 w-5 text-danger-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-400 mt-1">Sin datos disponibles</p>
        </div>
      </div>

      {/* Payments table - empty */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Pagos Recientes</h2>
        </div>
        <div className="p-12 text-center">
          <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No hay pagos registrados</p>
          <p className="text-xs text-gray-400 mt-1">Los pagos aparecerán aquí cuando se registren</p>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Registrar Pago</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400" aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
              <div>
                <label htmlFor="pago-cliente" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select id="pago-cliente" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Seleccionar cliente</option>
                </select>
              </div>
              <div>
                <label htmlFor="pago-concepto" className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                <input id="pago-concepto" type="text" placeholder="Ej: Honorarios - Residencia Temporal" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label htmlFor="pago-monto" className="block text-sm font-medium text-gray-700 mb-1">Monto (MXN)</label>
                <input id="pago-monto" type="number" placeholder="0.00" min="0" step="0.01" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label htmlFor="pago-metodo" className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                <select id="pago-metodo" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Seleccionar método</option>
                  <option value="transferencia">Transferencia bancaria</option>
                  <option value="tarjeta">Tarjeta de crédito/débito</option>
                  <option value="efectivo">Efectivo</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
