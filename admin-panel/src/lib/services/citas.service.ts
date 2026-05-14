import { api } from '../api';
import type {
  Cita,
  PaginatedResponse,
  SearchCitasParams,
  CreateCitaData,
  ReagendarCitaData,
} from '../types';

export const citasService = {
  async getCitas(params: SearchCitasParams): Promise<PaginatedResponse<Cita>> {
    const { data } = await api.get<PaginatedResponse<Cita>>('/citas', { params });
    return data;
  },

  async getCitasHoy(): Promise<Cita[]> {
    const { data } = await api.get<Cita[]>('/citas/hoy');
    return data;
  },

  async getCita(id: string): Promise<Cita> {
    const { data } = await api.get<Cita>(`/citas/${id}`);
    return data;
  },

  async createCita(citaData: CreateCitaData): Promise<Cita> {
    const { data } = await api.post<Cita>('/citas', citaData);
    return data;
  },

  async reagendarCita(id: string, reagendarData: ReagendarCitaData): Promise<Cita> {
    const { data } = await api.patch<Cita>(`/citas/${id}/reagendar`, reagendarData);
    return data;
  },

  async cancelarCita(id: string): Promise<Cita> {
    const { data } = await api.patch<Cita>(`/citas/${id}/cancelar`);
    return data;
  },
};
