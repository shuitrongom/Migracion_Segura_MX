'use client';

import { useState } from 'react';
import { DollarSign, Plus, X, TrendingUp, AlertCircle, Users } from 'lucide-react';

interface Pago {
  id: string;
  cliente: string;
  concepto: string;
  monto: number;
  metodo: string;
  fecha: string;
  estatus: 'completado' | 'pendiente' | 'cancelado';
}

const ESTATUS_BADGE: Record<string, { className: string; label: string }> = {
  completado: { className: 'bg-green-50 text-green-700', label: 'Completado' },
  pendiente: { className: 'bg-yellow-50 text-yellow-700', label: 'Pendiente' },
  cancelado: { className: 'bg-red-50 text-red-700', label: 'Cancelado' },
};

// Mock data
const MOCK_SUMMARY = {
  ingresosMes: 185000,
  pagosPendientes: 42500,
  clientesConAdeudo: 8,
};

const MOCK_PAGOS: Pago[] = [
  {
    id: '1',
    cliente: 'María García López',
    concepto: 'Honorarios - Residencia Temporal',
    monto: 15000,
    metodo: 'Transferencia bancaria',
    fecha: '2024-03-18',
    estatus: 'completado',
  },
  {
    id: '2',
    cliente: 'John Smith',
    concepto: 'Honorarios - Permiso de Trabajo',
    monto: 12000,
    metodo: 'Tarjeta de crédito',
    fecha: '2024-03-17',
    estatus: 'completado',
  },
  {
    id: '3',
    cliente: 'Pierre Dupont',
    concepto: 'Pago parcial - Visa',
    monto: 5000,
    metodo: 'Efectivo',
    fecha: '2024-03-16',
    estatus: 'completado',
  },
  {
    id: '4',
    cliente: 'Hans Mueller',
    concepto: 'Honorarios - Residencia Permanente',
    monto: 20000,
    metodo: 'Transferencia bancaria',
    fecha: '2024-03-15',
    estatus: 'pendiente',
  },
  {
    id: '5',
    cliente: 'Anna Kowalski',
    concepto: 'Honorarios - Renovación',
    monto: 8000,
    metodo: 'Tarjeta de crédito',
    fecha: '2024-03-14',
    estatus: 'pendiente',
  },
  {
    id: '6',
    cliente: 'Yuki Tanaka',
    concepto: 'Reembolso parcial',
    monto: 5000,
    metodo: 'Transferencia bancaria',
    fecha: '2024-03-12',
    estatus: 'cancelado',
  },
];

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
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(MOCK_SUMMARY.ingresosMes)}</p>
          <p className="text-xs text-gray-400 mt-1">Marzo 2024</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Pagos Pendientes</p>
            <AlertCircle className="h-5 w-5 text-warning-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(MOCK_SUMMARY.pagosPendientes)}</p>
          <p className="text-xs text-gray-400 mt-1">Total acumulado</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Clientes con Adeudo</p>
            <Users className="h-5 w-5 text-danger-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{MOCK_SUMMARY.clientesConAdeudo}</p>
          <p className="text-xs text-gray-400 mt-1">Requieren seguimiento</p>
        </div>
      </div>

      {/* Monthly chart placeholder */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Reporte Mensual</h2>
        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-center">
            <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Gráfica de ingresos mensuales</p>
            <p className="text-xs text-gray-300 mt-1">Integración pendiente</p>
          </div>
        </div>
      </div>

      {/* Recent payments table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Pagos Recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Concepto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Método</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Monto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PAGOS.map((pago) => {
                const badge = ESTATUS_BADGE[pago.estatus];
                return (
                  <tr key={pago.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{pago.cliente}</td>
                    <td className="px-4 py-3 text-gray-600">{pago.concepto}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{pago.metodo}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(pago.monto)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{pago.fecha}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for registering payment */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                Registrar Pago
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
              <div>
                <label htmlFor="pago-cliente" className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <select
                  id="pago-cliente"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Seleccionar cliente</option>
                  <option value="1">María García López</option>
                  <option value="2">John Smith</option>
                  <option value="3">Pierre Dupont</option>
                  <option value="4">Hans Mueller</option>
                </select>
              </div>
              <div>
                <label htmlFor="pago-concepto" className="block text-sm font-medium text-gray-700 mb-1">
                  Concepto
                </label>
                <input
                  id="pago-concepto"
                  type="text"
                  placeholder="Ej: Honorarios - Residencia Temporal"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label htmlFor="pago-monto" className="block text-sm font-medium text-gray-700 mb-1">
                  Monto (MXN)
                </label>
                <input
                  id="pago-monto"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label htmlFor="pago-metodo" className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago
                </label>
                <select
                  id="pago-metodo"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Seleccionar método</option>
                  <option value="transferencia">Transferencia bancaria</option>
                  <option value="tarjeta">Tarjeta de crédito/débito</option>
                  <option value="efectivo">Efectivo</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
