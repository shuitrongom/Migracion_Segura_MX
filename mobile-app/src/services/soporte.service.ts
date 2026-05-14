import { api } from '../lib/api';
import type { Ticket, PaginatedResponse, CreateTicketData, MensajeTicket } from '../types';

export const soporteService = {
  async getTickets(): Promise<PaginatedResponse<Ticket>> {
    const { data } = await api.get<PaginatedResponse<Ticket>>('/soporte/tickets');
    return data;
  },

  async getTicket(id: string): Promise<Ticket> {
    const { data } = await api.get<Ticket>(`/soporte/tickets/${id}`);
    return data;
  },

  async createTicket(ticketData: CreateTicketData): Promise<Ticket> {
    const { data } = await api.post<Ticket>('/soporte/tickets', ticketData);
    return data;
  },

  async addMessage(ticketId: string, contenido: string): Promise<MensajeTicket> {
    const { data } = await api.post<MensajeTicket>(`/soporte/tickets/${ticketId}/mensajes`, {
      contenido,
    });
    return data;
  },
};
