import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { maintenanceApi } from '@/api/service/maintenanceApi';
import type { AssignmentFormData, MaintenanceFormData, MaintenanceStatus } from '@/types/maintenance';

export function useMaintenance() {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ['maintenance', user?.id];
  const available = !!user?.id;

  const requestQuery = useQuery({
    queryKey: key, queryFn: maintenanceApi.list, enabled: available,
    refetchInterval: 12000, refetchOnWindowFocus: true, retry: 1,
  });

  const unitsQuery = useQuery({
    queryKey: ['maintenance-occupied-units', user?.id],
    queryFn: maintenanceApi.availableUnits,
    enabled: available && user?.role === 'tenant',
    refetchOnWindowFocus: true,
  });

  const invalidate = () => client.invalidateQueries({ queryKey: key });
  const createMutation = useMutation({ mutationFn: (data: MaintenanceFormData) =>
    maintenanceApi.create(data), onSuccess: invalidate });
  const assignMutation = useMutation({ mutationFn: (data: AssignmentFormData) =>
    maintenanceApi.assign(data), onSuccess: invalidate });
  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; status: MaintenanceStatus }) =>
      maintenanceApi.updateStatus(payload.id, payload.status),
    onSuccess: invalidate,
  });
  const noteMutation = useMutation({
    mutationFn: (payload: { id: string; content: string }) =>
      maintenanceApi.addNote(payload.id, payload.content),
    onSuccess: invalidate,
  });

  const createRequest = useCallback(async (data: MaintenanceFormData) =>
    createMutation.mutateAsync(data), [createMutation]);

  const assignRequest = useCallback(async (data: AssignmentFormData) =>
    assignMutation.mutateAsync(data), [assignMutation]);

  const updateStatus = useCallback(async (id: string, status: MaintenanceStatus) =>
    statusMutation.mutateAsync({ id, status }), [statusMutation]);

  const addNote = useCallback(async (id: string, content: string) =>
    noteMutation.mutateAsync({ id, content }), [noteMutation]);

  const requests = requestQuery.data ?? [];

  return {
    requests,
    isLoading: requestQuery.isLoading || createMutation.isPending ||
      assignMutation.isPending || statusMutation.isPending || noteMutation.isPending,
    loadError: requestQuery.error instanceof Error ? requestQuery.error.message : null,
    availableUnits: unitsQuery.data ?? [],
    unitsLoadError: unitsQuery.error instanceof Error ? unitsQuery.error.message : null,
    createRequest, assignRequest, updateStatus, addNote,
    getEmployees: maintenanceApi.assignees,
    getRequestsByStatus: (status: MaintenanceStatus) =>
      requests.filter(request => request.status === status),
    getRequestsByPriority: (priority: (typeof requests)[number]['priority']) =>
      requests.filter(request => request.priority === priority),
    refresh: invalidate,
  };
}
