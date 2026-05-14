import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tramitesService } from '@/lib/services';
import type {
  SearchTramitesParams,
  CreateTramiteData,
  UpdateEstatusData,
  CreateTareaInternaData,
} from '@/lib/types';

export function useTramites(params: SearchTramitesParams) {
  return useQuery({
    queryKey: ['tramites', params],
    queryFn: () => tramitesService.getTramites(params),
  });
}

export function useTramite(id: string | undefined) {
  return useQuery({
    queryKey: ['tramite', id],
    queryFn: () => tramitesService.getTramite(id!),
    enabled: !!id,
  });
}

export function useTimeline(id: string | undefined) {
  return useQuery({
    queryKey: ['tramite', id, 'timeline'],
    queryFn: () => tramitesService.getTimeline(id!),
    enabled: !!id,
  });
}

export function useCreateTramite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTramiteData) => tramitesService.createTramite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tramites'] });
    },
  });
}

export function useUpdateEstatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEstatusData }) =>
      tramitesService.updateEstatus(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tramites'] });
      queryClient.invalidateQueries({ queryKey: ['tramite', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tramite', variables.id, 'timeline'] });
    },
  });
}

export function useAssignResponsable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, responsableId }: { id: string; responsableId: string }) =>
      tramitesService.assignResponsable(id, responsableId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tramites'] });
      queryClient.invalidateQueries({ queryKey: ['tramite', variables.id] });
    },
  });
}

export function useTareasInternas(tramiteId: string | undefined) {
  return useQuery({
    queryKey: ['tramite', tramiteId, 'tareas'],
    queryFn: () => tramitesService.getTareasInternas(tramiteId!),
    enabled: !!tramiteId,
  });
}

export function useCreateTareaInterna() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tramiteId, data }: { tramiteId: string; data: CreateTareaInternaData }) =>
      tramitesService.createTareaInterna(tramiteId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tramite', variables.tramiteId, 'tareas'] });
    },
  });
}

export function useCompleteTareaInterna() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tareaId: string) => tramitesService.completeTareaInterna(tareaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tramite'] });
    },
  });
}

export function usePlantillas() {
  return useQuery({
    queryKey: ['tramites', 'plantillas'],
    queryFn: () => tramitesService.getPlantillas(),
  });
}

export function useConsultaPieza(numeroPieza: string | undefined) {
  return useQuery({
    queryKey: ['tramites', 'consulta', numeroPieza],
    queryFn: () => tramitesService.consultaPieza(numeroPieza!),
    enabled: !!numeroPieza,
  });
}
