'use client';

import { Bell, Check, CheckCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function NotificacionesPage() {
  const queryClient = useQueryClient();

  const notifQuery = useQuery({
    queryKey: ['notificaciones'],
    queryFn: async () => {
      const res = await api.get('/notificaciones?page=1&limit=50');
      return res.data?.data || [];
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notificaciones/read-all'),
    onSuccess: () => {
      toast.success('Todas marcadas como leídas');
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notificaciones/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notificaciones = notifQuery.data || [];
  const unread = notificaciones.filter((n: any) => !n.leida).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-neutral-900 via-stone-800 to-amber-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notificaciones</h1>
            <p className="text-amber-200 mt-1">{unread > 0 ? `${unread} sin leer` : 'Todo al día'}</p>
          </div>
          {unread > 0 && (
            <button onClick={() => markAllRead.mutate()} className="px-4 py-2 bg-[#222222] hover:bg-[#171717]/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <CheckCheck className="h-4 w-4" /> Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="dark-card-static overflow-hidden">
        {notifQuery.isLoading ? (
          <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : notificaciones.length === 0 ? (
          <div className="p-16 text-center">
            <Bell className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-white/70">No hay notificaciones</p>
          </div>
        ) : (
          <div className="divide-y divide-[#262626]">
            {notificaciones.map((notif: any) => (
              <div
                key={notif.id}
                className={`flex items-start gap-4 p-5 hover:bg-[#1a1a1a] transition-colors cursor-pointer ${!notif.leida ? 'bg-amber-500/[0.04] border-l-4 border-l-amber-500' : ''}`}
                onClick={() => { if (!notif.leida) markRead.mutate(notif.id); }}
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${!notif.leida ? 'bg-amber-500/10' : 'bg-[#222222]'}`}>
                  <Bell className={`h-4 w-4 ${!notif.leida ? 'text-amber-500' : 'text-white/70'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!notif.leida ? 'font-semibold text-white' : 'text-white/70'}`}>{notif.titulo}</p>
                    {!notif.leida && <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0" />}
                  </div>
                  <p className="text-sm text-white/50 mt-1">{notif.contenido}</p>
                  {notif.metadata && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {notif.metadata.tramiteId && <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">Trámite</span>}
                      {notif.metadata.solicitudId && <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">Solicitud</span>}
                      {notif.metadata.documentoId && <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">Documento</span>}
                    </div>
                  )}
                  <p className="text-xs text-white/30 mt-2">{notif.createdAt ? new Date(notif.createdAt).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
