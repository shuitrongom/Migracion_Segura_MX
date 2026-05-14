import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesService } from '@/lib/services';
import type {
  SearchClientesParams,
  CreateClienteData,
  UpdateClienteData,
} from '@/lib/types';

export function useClientes(params: SearchClientesParams) {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: () => clientesService.getClientes(params),
  });
}

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: () => clientesService.getCliente(id!),
    enabled: !!id,
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClienteData) => clientesService.createCliente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClienteData }) =>
      clientesService.updateCliente(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.id] });
    },
  });
}

export function useAssignAsesor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clienteId, asesorId }: { clienteId: string; asesorId: string }) =>
      clientesService.assignAsesor(clienteId, asesorId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.clienteId] });
    },
  });
}

export function useClienteActividad(id: string | undefined) {
  return useQuery({
    queryKey: ['cliente', id, 'actividad'],
    queryFn: () => clientesService.getActivityHistory(id!),
    enabled: !!id,
  });
}

export function useClienteNotas(id: string | undefined) {
  return useQuery({
    queryKey: ['cliente', id, 'notas'],
    queryFn: () => clientesService.getNotas(id!),
    enabled: !!id,
  });
}

export function useCreateNota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, contenido }: { id: string; contenido: string }) =>
      clientesService.createNota(id, contenido),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.id, 'notas'] });
    },
  });
}

export function useAddTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, etiqueta }: { id: string; etiqueta: string }) =>
      clientesService.addTag(id, etiqueta),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useRemoveTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, etiqueta }: { id: string; etiqueta: string }) =>
      clientesService.removeTag(id, etiqueta),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}
