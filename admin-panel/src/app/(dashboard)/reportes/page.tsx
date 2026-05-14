'use client';

import { useState } from 'react';
import { BarChart3, Download, Calendar } from 'lucide-react';

type TabId = 'rendimiento' | 'conversion' | 'tiempos' | 'documentos';

interface TabConfig {
  id: TabId;
  label: string;
}

const TABS: TabConfig[] = [
  { id: 'rendimiento', label: 'Rendimiento' },
  { id: 'conversion', label: 'Conversión' },
  { id: 'tiempos', label: 'Tiempos' },
  { id: 'documentos', label: 'Documentos' },
];

// Mock data per tab
const MOCK_DATA: Record<TabId, { chartTitle: string; columns: string[]; rows: string[][] }> = {
  rendimiento: {
    chartTitle: 'Trámites procesados por mes',
    columns: ['Mes', 'Recibidos', 'Completados', 'Pendientes'],
    rows: [
      ['Enero 2024', '15', '12', '3'],
      ['Febrero 2024', '22', '18', '4'],
      ['Marzo 2024', '28', '20', '8'],
    ],
  },
  conversion: {
    chartTitle: 'Tasa de conversión por etapa',
    columns: ['Etapa', 'Entradas', 'Salidas', 'Tasa'],
    rows: [
      ['Consulta → Registro', '50', '42', '84%'],
      ['Registro → Documentos', '42', '38', '90%'],
      ['Documentos → Revisión', '38', '35', '92%'],
      ['Revisión → Aprobación', '35', '30', '86%'],
    ],
  },
  tiempos: {
    chartTitle: 'Tiempo promedio por tipo de trámite',
    columns: ['Tipo de Trámite', 'Promedio (días)', 'Mínimo', 'Máximo'],
    rows: [
      ['Residencia Temporal', '45', '30', '60'],
      ['Residencia Permanente', '90', '60', '120'],
      ['Permiso de Trabajo', '35', '20', '50'],
      ['Visa', '25', '15', '40'],
      ['Nacionalidad', '180', '120', '240'],
    ],
  },
  documentos: {
    chartTitle: 'Documentos procesados por estatus',
    columns: ['Tipo Documento', 'Aprobados', 'Rechazados', 'Tasa Rechazo'],
    rows: [
      ['Pasaporte', '85', '5', '5.6%'],
      ['Comprobante domicilio', '72', '12', '14.3%'],
      ['Carta de empleo', '60', '15', '20%'],
      ['Acta de nacimiento', '90', '3', '3.2%'],
      ['Fotografías', '95', '8', '7.8%'],
    ],
  },
};

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState<TabId>('rendimiento');
  const [dateRange, setDateRange] = useState({ from: '2024-01-01', to: '2024-03-18' });

  const tabData = MOCK_DATA[activeTab];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-brand-500" />
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Export buttons */}
          <button
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label="Exportar a PDF"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label="Exportar a CSV"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Date range filter */}
      <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Período:</span>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="report-from" className="sr-only">Fecha desde</label>
            <input
              id="report-from"
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Fecha desde"
            />
            <span className="text-gray-400 text-sm">a</span>
            <label htmlFor="report-to" className="sr-only">Fecha hasta</label>
            <input
              id="report-to"
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Fecha hasta"
            />
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0 -mb-px" aria-label="Pestañas de reportes">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Chart placeholder */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{tabData.chartTitle}</h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-center">
            <BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Gráfica de {tabData.chartTitle.toLowerCase()}</p>
            <p className="text-xs text-gray-300 mt-1">Integración con librería de gráficas pendiente</p>
          </div>
        </div>
      </div>

      {/* Data table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Datos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                {tabData.columns.map((col) => (
                  <th key={col} className="text-left px-4 py-3 font-medium text-gray-500">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabData.rows.map((row, idx) => (
                <tr key={idx} className="border-b last:border-b-0 hover:bg-gray-50">
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className={`px-4 py-3 ${cellIdx === 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
