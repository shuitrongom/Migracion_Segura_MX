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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] }),
  });

  const notificaciones = notifQuery.data || [];
  const unread = notificaciones.filter((n: any) => !n.leida).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notificaciones</h1>
            <p className="text-purple-200 mt-1">{unread > 0 ? `${unread} sin leer` : 'Todo al día'}</p>
          </div>
          {unread > 0 && (
            <button onClick={() => markAllRead.mutate()} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <CheckCheck className="h-4 w-4" /> Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {notifQuery.isLoading ? (
          <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : notificaciones.length === 0 ? (
          <div className="p-16 text-center">
            <Bell className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No hay notificaciones</p>
          </div>
        ) : (
          <div className="divide-y">
            {notificaciones.map((notif: any) => (
              <div key={notif.id} className={`flex items-start gap-4 p-5 hover:bg-gray-50 transition-colors ${!notif.leida ? 'bg-brand-50/30 border-l-4 border-l-brand-500' : ''}`}>
                <div className={`p-2.5 rounded-xl shrink-0 ${!notif.leida ? 'bg-brand-100' : 'bg-gray-100'}`}>
                  <Bell className={`h-4 w-4 ${!notif.leida ? 'text-brand-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.leida ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{notif.titulo}</p>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notif.contenido}</p>
                  <p className="text-xs text-gray-400 mt-1">{notif.createdAt ? new Date(notif.createdAt).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                </div>
                {!notif.leida && (
                  <button onClick={() => markRead.mutate(notif.id)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-green-500 transition-colors shrink-0" title="Marcar como leída">
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
