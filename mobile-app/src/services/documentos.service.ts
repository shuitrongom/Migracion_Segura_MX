import { api } from '../lib/api';
import type { Documento, UploadDocumentoMetadata } from '../types';

export const documentosService = {
  async uploadDocumento(file: {
    uri: string;
    name: string;
    type: string;
  }, metadata: UploadDocumentoMetadata): Promise<Documento> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
    formData.append('expedienteId', metadata.expedienteId);
    formData.append('nombre', metadata.nombre);
    if (metadata.tramiteId) formData.append('tramiteId', metadata.tramiteId);
    if (metadata.categoria) formData.append('categoria', metadata.categoria);
    if (metadata.fechaVencimiento) formData.append('fechaVencimiento', metadata.fechaVencimiento);

    const { data } = await api.post<Documento>('/documentos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getByTramite(tramiteId: string): Promise<Documento[]> {
    const { data } = await api.get<Documento[]>(`/documentos/tramite/${tramiteId}`);
    return data;
  },

  async getPendientes(clienteId: string): Promise<Documento[]> {
    const { data } = await api.get<Documento[]>(`/documentos/pendientes/${clienteId}`);
    return data;
  },
};
