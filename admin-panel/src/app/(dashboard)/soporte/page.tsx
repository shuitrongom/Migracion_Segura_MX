'use client';

import { useState } from 'react';
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, Inbox } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const ESTATUS_CONFIG: Record<string, { label: string; color: string }> = {
  abierto: { label: 'Abierto', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  en_atencion: { label: 'En atención', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  resuelto: { label: 'Resuelto', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  cerrado: { label: 'Cerrado', color: 'bg-[#141414] text-white/60 border-[#2a2a2a]' },
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
  const abiertos = tickets.filter((t: any) => t.estatus === 'abierto' || t.estatus === 'en_atencion').length;
  const resueltos = tickets.filter((t: any) => t.estatus === 'resuelto' || t.estatus === 'cerrado').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 via-stone-800 to-amber-700 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">Soporte</h1>
          <p className="text-amber-200 mt-1">Tickets de ayuda de los extranjeros</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500 to-amber-600 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/40">Total Tickets</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20/30">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{tickets.length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-amber-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/40">Abiertos</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-amber-600 text-white shadow-lg shadow-blue-200/30">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{abiertos}</p>
          </div>
        </div>
        <div className="relative overflow-hidden dark-card-static p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/40">Resueltos</p>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/30">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{resueltos}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de tickets */}
        <div className="lg:col-span-1 dark-card-static overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 px-5 py-4 border-b">
            <div className="p-2 rounded-lg bg-amber-500/10"><Inbox className="h-4 w-4 text-amber-500" /></div>
            <h2 className="text-lg font-bold text-white">Tickets</h2>
            <span className="ml-auto text-xs font-medium text-white/30">{tickets.length}</span>
          </div>
          {ticketsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500/15 to-amber-600/15 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-amber-400/70" />
              </div>
              <p className="text-white/40 font-medium">Sin tickets</p>
            </div>
          ) : (
            <div className="divide-y divide-[#262626] max-h-[600px] overflow-y-auto">
              {tickets.map((ticket: any) => {
                const config = ESTATUS_CONFIG[ticket.estatus] || ESTATUS_CONFIG.abierto;
                return (
                  <button key={ticket.id} onClick={() => setSelectedTicket(ticket)} className={`w-full text-left px-5 py-4 hover:bg-[#1f1f1f] transition-colors ${selectedTicket?.id === ticket.id ? 'bg-amber-500/10/50 border-l-4 border-l-brand-500' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-white line-clamp-1">{ticket.asunto}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${config.color}`}>{config.label}</span>
                    </div>
                    <p className="text-xs text-white/40 mt-1 line-clamp-1">{ticket.descripcion}</p>
                    <p className="text-[10px] text-white/30 mt-1.5">{ticket.createdAt?.slice(0, 10)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detalle del ticket */}
        <div className="lg:col-span-2 dark-card-static overflow-hidden hover:shadow-md transition-shadow duration-300">
          {!selectedTicket ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-white/20" />
              </div>
              <p className="text-white/40 font-medium">Selecciona un ticket</p>
              <p className="text-sm text-white/30 mt-1">Elige un ticket de la lista para ver los detalles</p>
            </div>
          ) : (
            <div className="flex flex-col h-[600px]">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-white/[0.02] to-white/[0.04]">
                <div>
                  <p className="font-bold text-white">{selectedTicket.asunto}</p>
                  <p className="text-xs text-white/40 mt-0.5">{selectedTicket.createdAt?.slice(0, 10)}</p>
                </div>
                {selectedTicket.estatus !== 'cerrado' && (
                  <button onClick={() => cerrarTicket.mutate(selectedTicket.id)} className="px-4 py-2 text-xs font-semibold text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors">
                    Cerrar ticket
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <div className="p-4 rounded-xl bg-gradient-to-r from-white/[0.02] to-white/[0.04] border">
                  <p className="text-sm text-white/70">{selectedTicket.descripcion}</p>
                  <p className="text-[10px] text-white/30 mt-2">Mensaje inicial del cliente</p>
                </div>
                {selectedTicket.mensajes?.map((msg: any) => (
                  <div key={msg.id} className={`p-4 rounded-xl ${msg.autorId === selectedTicket.clienteId ? 'bg-[#141414] border' : 'bg-gradient-to-r from-amber-500/10 to-amber-500/10 border border-amber-500/20 ml-8'}`}>
                    <p className="text-sm text-white/70">{msg.contenido}</p>
                    <p className="text-[10px] text-white/30 mt-2">{msg.createdAt?.slice(0, 16).replace('T', ' ')}</p>
                  </div>
                ))}
              </div>
              {selectedTicket.estatus !== 'cerrado' && (
                <div className="p-4 border-t bg-gradient-to-r from-white/[0.02] to-white/[0.04]">
                  <div className="flex gap-2">
                    <input type="text" value={respuesta} onChange={e => setRespuesta(e.target.value)} placeholder="Escribe tu respuesta..." className="flex-1 px-4 py-2.5 border border-[#2a2a2a] rounded-xl text-sm bg-[#171717] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" onKeyDown={e => { if (e.key === 'Enter' && respuesta.trim()) enviarRespuesta.mutate(); }} />
                    <button onClick={() => { if (respuesta.trim()) enviarRespuesta.mutate(); }} disabled={!respuesta.trim()} className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-brand-600 text-white rounded-xl text-sm font-semibold hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 shadow-lg shadow-amber-500/20/30 transition-all">
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
