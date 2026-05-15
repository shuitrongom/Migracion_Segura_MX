import { useQuery } from '@tanstack/react-query';
import { citasService } from '@/lib/services/citas.service';
import { tramitesService } from '@/lib/services/tramites.service';
import { clientesService } from '@/lib/services/clientes.service';
import { notificacionesService } from '@/lib/services/notificaciones.service';
import type { EstatusTramite } from '@/lib/types';

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const [tramitesResponse, clientesResponse, tramitesEnProcesoResponse] = await Promise.all([
        tramitesService.getTramites({ page: 1, limit: 1 }),
        clientesService.getClientes({ page: 1, limit: 1 }),
        tramitesService.getTramites({ estatus: 'en_revision' as any, page: 1, limit: 1 }),
      ]);

      return {
        totalTramites: tramitesResponse.total,
        totalClientes: clientesResponse.total,
        tramitesEnProceso: tramitesEnProcesoResponse.total,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCitasHoy() {
  return useQuery({
    queryKey: ['citas', 'hoy'],
    queryFn: () => citasService.getCitasHoy(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: async () => {
      const tramites = await tramitesService.getTramites({ page: 1, limit: 10 });
      return tramites.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useTramitesByEstatus(estatus: EstatusTramite) {
  return useQuery({
    queryKey: ['dashboard', 'tramites', estatus],
    queryFn: () => tramitesService.getTramites({ estatus, page: 1, limit: 50 }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: ['notificaciones', 'unread-count'],
    queryFn: () => notificacionesService.getUnreadCount(),
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
}
