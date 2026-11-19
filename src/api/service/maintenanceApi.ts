import { apiRequest } from '@/api/https';
import type { AssignmentFormData, MaintenanceFormData, MaintenanceRequest,
  MaintenanceStatus } from '@/types/maintenance';

interface ApiNote {
  id: number; content: string; userName: string;
  userRole: string; createdAt: string;
}
interface ApiMaintenance {
  id: number; ticketNumber: string; tenantId?: number | null; tenantName?: string | null;
  unitId?: number | null; unitNumber?: string | null;
  propertyId?: number | null; propertyName?: string | null;
  title: string; description: string; category: string;
  priority: string; status: string; assignedTo?: number | null;
  assignedToName?: string | null; estimatedCost?: number | null;
  actualCost?: number | null; scheduledDate?: string | null;
  completedDate?: string | null; notes?: ApiNote[] | null;
  createdAt?: string | null; updatedAt?: string | null;
}

export interface MaintenanceUnitOption { id: number; unitNumber: string; propertyName: string }
export interface MaintenanceAssignee { id: string; name: string; specialty: string }

function mapMaintenance(record: ApiMaintenance): MaintenanceRequest {
  return {
    id: String(record.id), ticketNumber: record.ticketNumber ?? String(record.id),
    tenantId: String(record.tenantId ?? ''), tenantName: record.tenantName || 'Unknown',
    unitId: String(record.unitId ?? ''), unitNumber: record.unitNumber || '',
    propertyId: String(record.propertyId ?? ''), propertyName: record.propertyName || '',
    title: record.title || '', description: record.description || '',
    category: (record.category || 'other').toLowerCase() as MaintenanceRequest['category'],
    priority: (record.priority || 'medium').toLowerCase() as MaintenanceRequest['priority'],
    status: (record.status || 'pending').toLowerCase() as MaintenanceRequest['status'],
    assignedTo: record.assignedTo == null ? undefined : String(record.assignedTo),
    assignedToName: record.assignedToName || undefined,
    estimatedCost: record.estimatedCost ?? undefined,
    actualCost: record.actualCost ?? undefined,
    scheduledDate: record.scheduledDate || undefined,
    completedDate: record.completedDate || undefined,
    createdAt: record.createdAt || '', updatedAt: record.updatedAt || '',
    photos: [],
    notes: (record.notes || []).map(note => ({
      id: String(note.id), requestId: String(record.id),
      userId: '', userName: note.userName || 'System',
      userRole: (note.userRole || 'SYSTEM').toLowerCase() as MaintenanceRequest['notes'][number]['userRole'],
      content: note.content || '', createdAt: note.createdAt,
    })),
  };
}

export const maintenanceApi = {
  list: async () => (await apiRequest<null, ApiMaintenance[]>({
    path: '/api/maintenance', method: 'GET',
  })).map(mapMaintenance),

  create: async (data: MaintenanceFormData) => mapMaintenance(
    await apiRequest<{
      unitId: number; category: string; priority: string; title: string; description: string;
    }, ApiMaintenance>({
      path: '/api/maintenance', method: 'POST',
      body: { ...data, unitId: Number(data.unitId) },
    })),

  assign: async (data: AssignmentFormData) => mapMaintenance(
    await apiRequest<{
      requestId: number; assignedTo: number; scheduledDate?: string;
      estimatedCost?: number; notes?: string;
    }, ApiMaintenance>({
      path: '/api/maintenance/assign', method: 'POST',
      body: { ...data, requestId: Number(data.requestId), assignedTo: Number(data.assignedTo),
        scheduledDate: data.scheduledDate || undefined },
    })),

  updateStatus: async (id: string, status: MaintenanceStatus) => mapMaintenance(
    await apiRequest<null, ApiMaintenance>({
      path: `/api/maintenance/${encodeURIComponent(id)}/status?status=${encodeURIComponent(status.toUpperCase())}`,
      method: 'PATCH',
    })),

  addNote: async (id: string, content: string) =>
    apiRequest<{ requestId: number; content: string }, ApiNote>({
      path: '/api/maintenance/notes', method: 'POST',
      body: { requestId: Number(id), content },
    }),

  availableUnits: () => apiRequest<null, MaintenanceUnitOption[]>({
    path: '/api/maintenance/units', method: 'GET',
  }),

  assignees: async (id: string): Promise<MaintenanceAssignee[]> => (
    await apiRequest<null, Array<{ id: number; name: string; specialty: string }>>({
      path: `/api/maintenance/${encodeURIComponent(id)}/assignees`, method: 'GET',
    })
  ).map(employee => ({ ...employee, id: String(employee.id) })),
};
