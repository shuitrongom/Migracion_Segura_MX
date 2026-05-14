import { api } from '../lib/api';
import type {
  Tramite,
  PaginatedResponse,
  CreateTramiteData,
  TimelineEntry,
  FormField,
  ConsultaPiezaResult,
  TipoTramite,
} from '../types';

export const tramitesService = {
  async getMisTramites(): Promise<PaginatedResponse<Tramite>> {
    const { data } = await api.get<PaginatedResponse<Tramite>>('/tramites');
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

  async saveDraft(id: string, datosFormulario: Record<string, unknown>): Promise<Tramite> {
    const { data } = await api.put<Tramite>(`/tramites/${id}/borrador`, { datosFormulario });
    return data;
  },

  async submitDraft(id: string): Promise<Tramite> {
    const { data } = await api.post<Tramite>(`/tramites/${id}/enviar`);
    return data;
  },

  async consultaPieza(numeroPieza: string): Promise<ConsultaPiezaResult> {
    const { data } = await api.get<ConsultaPiezaResult>('/tramites/consulta', {
      params: { numeroPieza },
    });
    return data;
  },

  async getFormByType(tipo: TipoTramite): Promise<FormField[]> {
    const { data } = await api.get<FormField[]>(`/tramites/formulario/${tipo}`);
    return data;
  },
};
