import { api } from '../api';
import type { Documento, UploadDocumentoMetadata } from '../types';

export interface DocumentoHistorial {
  id: string;
  documentoId: string;
  accion: string;
  descripcion: string;
  realizadoPorId: string;
  createdAt: string;
}

export const documentosService = {
  async uploadDocumento(file: File, metadata: UploadDocumentoMetadata): Promise<Documento> {
    const formData = new FormData();
    formData.append('file', file);
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

  async getDocumento(id: string): Promise<Documento> {
    const { data } = await api.get<Documento>(`/documentos/${id}`);
    return data;
  },

  async downloadDocumento(id: string): Promise<Blob> {
    const { data } = await api.get<Blob>(`/documentos/${id}/download`, {
      responseType: 'blob',
    });
    return data;
  },

  async getByExpediente(expedienteId: string): Promise<Documento[]> {
    const { data } = await api.get<Documento[]>(`/documentos/expediente/${expedienteId}`);
    return data;
  },

  async getByTramite(tramiteId: string): Promise<Documento[]> {
    const { data } = await api.get<Documento[]>(`/documentos/tramite/${tramiteId}`);
    return data;
  },

  async aprobarDocumento(id: string, comentario?: string): Promise<Documento> {
    const { data } = await api.patch<Documento>(`/documentos/${id}/aprobar`, { comentario });
    return data;
  },

  async rechazarDocumento(id: string, razon: string): Promise<Documento> {
    const { data } = await api.patch<Documento>(`/documentos/${id}/rechazar`, { razon });
    return data;
  },

  async getHistorial(id: string): Promise<DocumentoHistorial[]> {
    const { data } = await api.get<DocumentoHistorial[]>(`/documentos/${id}/historial`);
    return data;
  },

  async getPorVencer(): Promise<Documento[]> {
    const { data } = await api.get<Documento[]>('/documentos/por-vencer');
    return data;
  },
};
