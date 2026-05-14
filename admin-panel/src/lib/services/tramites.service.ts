import { api } from '../api';
import type {
  Tramite,
  EtapaTramite,
  TareaInterna,
  PlantillaProceso,
  PaginatedResponse,
  SearchTramitesParams,
  CreateTramiteData,
  UpdateEstatusData,
  CreateTareaInternaData,
} from '../types';

export interface TimelineEntry {
  id: string;
  tipo: string;
  descripcion: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ConsultaPiezaResult {
  tramiteId: string;
  numeroPieza: string;
  tipo: string;
  estatus: string;
  ultimaActualizacion: string;
}

export const tramitesService = {
  async getTramites(params: SearchTramitesParams): Promise<PaginatedResponse<Tramite>> {
    const { data } = await api.get<PaginatedResponse<Tramite>>('/tramites', { params });
    return data;
  },

  async getTramite(id: string): Promise<Tramite> {
    const { data } = await api.get<Tramite>(`/tramites/${id}`);
    return data;
  },

  async getTimeline(id: string): Promise<TimelineEntry[]> {
    const { data } = await api.get<TimelineEntry[]>(`/tramites/${id}/timeline`);
    return data;
  },

  async createTramite(tramiteData: CreateTramiteData): Promise<Tramite> {
    const { data } = await api.post<Tramite>('/tramites', tramiteData);
    return data;
  },

  async updateEstatus(id: string, estatusData: UpdateEstatusData): Promise<Tramite> {
    const { data } = await api.patch<Tramite>(`/tramites/${id}/estatus`, estatusData);
    return data;
  },

  async assignResponsable(id: string, responsableId: string): Promise<Tramite> {
    const { data } = await api.patch<Tramite>(`/tramites/${id}/responsable`, { responsableId });
    return data;
  },

  async getTareasInternas(id: string): Promise<TareaInterna[]> {
    const { data } = await api.get<TareaInterna[]>(`/tramites/${id}/tareas`);
    return data;
  },

  async createTareaInterna(id: string, tareaData: CreateTareaInternaData): Promise<TareaInterna> {
    const { data } = await api.post<TareaInterna>(`/tramites/${id}/tareas`, tareaData);
    return data;
  },

  async completeTareaInterna(tareaId: string): Promise<TareaInterna> {
    const { data } = await api.patch<TareaInterna>(`/tramites/tareas/${tareaId}/completar`);
    return data;
  },

  async getPlantillas(): Promise<PlantillaProceso[]> {
    const { data } = await api.get<PlantillaProceso[]>('/tramites/plantillas');
    return data;
  },

  async consultaPieza(numeroPieza: string): Promise<ConsultaPiezaResult> {
    const { data } = await api.get<ConsultaPiezaResult>('/tramites/consulta', {
      params: { numeroPieza },
    });
    return data;
  },
};
