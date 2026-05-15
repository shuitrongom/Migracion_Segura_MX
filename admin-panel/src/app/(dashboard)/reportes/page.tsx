'use client';

import { useState } from 'react';
import { BarChart3, Download, Calendar } from 'lucide-react';

type TabId = 'rendimiento' | 'conversion' | 'tiempos' | 'documentos';

const TABS: { id: TabId; label: string }[] = [
  { id: 'rendimiento', label: 'Rendimiento' },
  { id: 'conversion', label: 'Conversión' },
  { id: 'tiempos', label: 'Tiempos' },
  { id: 'documentos', label: 'Documentos' },
];

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState<TabId>('rendimiento');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-brand-500" />
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" aria-label="Exportar a PDF">
            <Download className="h-4 w-4" />PDF
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" aria-label="Exportar a CSV">
            <Download className="h-4 w-4" />CSV
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
            <input id="report-from" type="date" value={dateRange.from} onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" aria-label="Fecha desde" />
            <span className="text-gray-400 text-sm">a</span>
            <input id="report-to" type="date" value={dateRange.to} onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" aria-label="Fecha hasta" />
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0 -mb-px" aria-label="Pestañas de reportes">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} aria-selected={activeTab === tab.id} role="tab">
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-xl border shadow-sm p-12">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No hay datos disponibles</h2>
          <p className="text-sm text-gray-500">Los reportes estarán disponibles próximamente cuando se integren las fuentes de datos.</p>
        </div>
      </div>
    </div>
  );
}
