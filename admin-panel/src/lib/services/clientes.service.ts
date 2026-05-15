import { api } from '../api';
import type {
  Cliente,
  PaginatedResponse,
  SearchClientesParams,
  CreateClienteData,
  UpdateClienteData,
  ActividadCliente,
  NotaCliente,
} from '../types';

export const clientesService = {
  async getClientes(params: SearchClientesParams): Promise<PaginatedResponse<Cliente>> {
    const { data } = await api.get<PaginatedResponse<Cliente>>('/clientes', { params });
    return data;
  },

  async getCliente(id: string): Promise<Cliente> {
    const { data } = await api.get<Cliente>(`/clientes/${id}`);
    return data;
  },

  async createCliente(clienteData: CreateClienteData): Promise<Cliente> {
    const { data } = await api.post<Cliente>('/clientes', clienteData);
    return data;
  },

  async updateCliente(id: string, clienteData: UpdateClienteData): Promise<Cliente> {
    const { data } = await api.put<Cliente>(`/clientes/${id}`, clienteData);
    return data;
  },

  async assignAsesor(clienteId: string, asesorId: string): Promise<Cliente> {
    const { data } = await api.patch<Cliente>(`/clientes/${clienteId}/asesor`, { asesorId });
    return data;
  },

  async getActivityHistory(id: string): Promise<ActividadCliente[]> {
    const { data } = await api.get<ActividadCliente[]>(`/clientes/${id}/actividad`);
    return data;
  },

  async getNotas(id: string): Promise<NotaCliente[]> {
    const { data } = await api.get<NotaCliente[]>(`/clientes/${id}/notas`);
    return data;
  },

  async createNota(id: string, contenido: string): Promise<NotaCliente> {
    const { data } = await api.post<NotaCliente>(`/clientes/${id}/notas`, { contenido });
    return data;
  },

  async addTag(id: string, etiqueta: string): Promise<Cliente> {
    const { data } = await api.post<Cliente>(`/clientes/${id}/etiquetas`, { etiqueta });
    return data;
  },

  async removeTag(id: string, etiqueta: string): Promise<Cliente> {
    const { data } = await api.delete<Cliente>(`/clientes/${id}/etiquetas/${encodeURIComponent(etiqueta)}`);
    return data;
  },

  async deleteCliente(id: string): Promise<void> {
    await api.delete(`/clientes/${id}`);
  },
};
