'use client';

import { useState } from 'react';
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const ESTATUS_CONFIG: Record<string, { label: string; color: string }> = {
  abierto: { label: 'Abierto', color: 'bg-blue-50 text-blue-700' },
  en_atencion: { label: 'En atención', color: 'bg-yellow-50 text-yellow-700' },
  resuelto: { label: 'Resuelto', color: 'bg-green-50 text-green-700' },
  cerrado: { label: 'Cerrado', color: 'bg-gray-50 text-gray-600' },
};

export default function SoportePage() {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [respuesta, setRespuesta] = useState('');

  const ticketsQuery = useQuery({
    queryKey: ['soporte', 'tickets'],
    queryFn: async () => {
      const res = await api.get('/soporte/tickets');
      return res.data?.data || [];
    },
  });

  const enviarRespuesta = useMutation({
    mutationFn: async () => {
      await api.post(`/soporte/tickets/${selectedTicket.id}/mensajes`, { contenido: respuesta });
    },
    onSuccess: () => {
      toast.success('Respuesta enviada');
      setRespuesta('');
      queryClient.invalidateQueries({ queryKey: ['soporte'] });
      // Recargar ticket
      api.get(`/soporte/tickets/${selectedTicket.id}`).then(res => setSelectedTicket(res.data));
    },
    onError: () => toast.error('Error al enviar respuesta'),
  });

  const cerrarTicket = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/soporte/tickets/${id}/cerrar`);
    },
    onSuccess: () => {
      toast.success('Ticket cerrado');
      setSelectedTicket(null);
      queryClient.invalidateQueries({ queryKey: ['soporte'] });
    },
  });

  const tickets = ticketsQuery.data || [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-6 w-6 text-brand-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Soporte</h1>
          <p className="text-sm text-gray-500">Tickets de ayuda de los extranjeros</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de tickets */}
        <div className="lg:col-span-1 bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <p className="text-sm font-medium text-gray-700">{tickets.length} tickets</p>
          </div>
          {ticketsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Sin tickets</p>
            </div>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {tickets.map((ticket: any) => {
                const config = ESTATUS_CONFIG[ticket.estatus] || ESTATUS_CONFIG.abierto;
                return (
                  <button key={ticket.id} onClick={() => setSelectedTicket(ticket)} className={`w-full text-left p-4 hover:bg-gray-50 transition ${selectedTicket?.id === ticket.id ? 'bg-brand-50' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{ticket.asunto}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${config.color}`}>{config.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{ticket.descripcion}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{ticket.createdAt?.slice(0, 10)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detalle del ticket */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden">
          {!selectedTicket ? (
            <div className="p-12 text-center">
              <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Selecciona un ticket para ver los detalles</p>
            </div>
          ) : (
            <div className="flex flex-col h-[600px]">
              {/* Header */}
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{selectedTicket.asunto}</p>
                  <p className="text-xs text-gray-500">{selectedTicket.createdAt?.slice(0, 10)}</p>
                </div>
                {selectedTicket.estatus !== 'cerrado' && (
                  <button onClick={() => cerrarTicket.mutate(selectedTicket.id)} className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                    Cerrar ticket
                  </button>
                )}
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-700">{selectedTicket.descripcion}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Mensaje inicial del cliente</p>
                </div>
                {selectedTicket.mensajes?.map((msg: any) => (
                  <div key={msg.id} className={`p-3 rounded-lg ${msg.autorId === selectedTicket.clienteId ? 'bg-gray-50' : 'bg-brand-50 ml-8'}`}>
                    <p className="text-sm text-gray-700">{msg.contenido}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{msg.createdAt?.slice(0, 16).replace('T', ' ')}</p>
                  </div>
                ))}
              </div>

              {/* Responder */}
              {selectedTicket.estatus !== 'cerrado' && (
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <input type="text" value={respuesta} onChange={e => setRespuesta(e.target.value)} placeholder="Escribe tu respuesta..." className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" onKeyDown={e => { if (e.key === 'Enter' && respuesta.trim()) enviarRespuesta.mutate(); }} />
                    <button onClick={() => { if (respuesta.trim()) enviarRespuesta.mutate(); }} disabled={!respuesta.trim()} className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
