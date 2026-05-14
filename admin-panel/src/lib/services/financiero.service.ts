import { api } from '../api';
import type { Pago, PaginatedResponse, CreatePagoData, HistorialPagosParams } from '../types';

export interface SaldoPendiente {
  clienteId: string;
  totalCobrado: number;
  totalPagado: number;
  saldoPendiente: number;
}

export interface ReporteMensual {
  mes: number;
  anio: number;
  totalIngresos: number;
  totalPagos: number;
  desglosePorMetodo: Record<string, number>;
  desglosePorConcepto: Record<string, number>;
}

export const financieroService = {
  async registrarPago(pagoData: CreatePagoData): Promise<Pago> {
    const { data } = await api.post<Pago>('/financiero/pagos', pagoData);
    return data;
  },

  async getHistorialCliente(
    clienteId: string,
    params?: HistorialPagosParams,
  ): Promise<PaginatedResponse<Pago>> {
    const { data } = await api.get<PaginatedResponse<Pago>>(
      `/financiero/pagos/cliente/${clienteId}`,
      { params },
    );
    return data;
  },

  async getSaldoPendiente(clienteId: string): Promise<SaldoPendiente> {
    const { data } = await api.get<SaldoPendiente>(`/financiero/saldo/${clienteId}`);
    return data;
  },

  async getReporteMensual(mes: number, anio: number): Promise<ReporteMensual> {
    const { data } = await api.get<ReporteMensual>('/financiero/reporte-mensual', {
      params: { mes, anio },
    });
    return data;
  },
};
