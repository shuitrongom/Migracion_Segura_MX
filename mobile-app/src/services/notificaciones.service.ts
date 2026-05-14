import { api } from '../lib/api';
import type { Notificacion, PaginatedResponse, SearchNotificacionesParams } from '../types';

export const notificacionesService = {
  async getNotificaciones(
    params: SearchNotificacionesParams,
  ): Promise<PaginatedResponse<Notificacion>> {
    const { data } = await api.get<PaginatedResponse<Notificacion>>('/notificaciones', { params });
    return data;
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const { data } = await api.get<{ count: number }>('/notificaciones/unread-count');
    return data;
  },

  async markAsRead(id: string): Promise<Notificacion> {
    const { data } = await api.patch<Notificacion>(`/notificaciones/${id}/read`);
    return data;
  },
};
