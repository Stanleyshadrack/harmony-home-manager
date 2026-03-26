import { API_PATHS } from "../constants/constants";
import { apiRequest } from "../https";

/* =========================================================
   TYPES (use yours directly)
========================================================= */

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
export type MaintenanceCategory = 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'pest' | 'cleaning' | 'other';

export interface MaintenanceNote {
  id: string;
  requestId: string;
  userId: string;
  userName: string;
  userRole: 'landlord' | 'employee' | 'tenant';
  content: string;
  createdAt: string;
}

export interface MaintenanceRequest {
  id: string;
  ticketNumber: string;
  tenantId: string;
  tenantName: string;
  unitId: string;
  unitNumber: string;
  propertyId: string;
  propertyName: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  title: string;
  description: string;
  photos: string[];
  assignedTo?: string;
  assignedToName?: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: string;
  completedDate?: string;
  notes: MaintenanceNote[];
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceFormData {
  unitId: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  title: string;
  description: string;
}

export interface AssignmentFormData {
  requestId: string;
  assignedTo: string;
  scheduledDate?: string;
  estimatedCost?: number;
  notes?: string;
}

/* =========================================================
   BACKEND RESPONSE TYPES (adjust if needed)
========================================================= */

interface MaintenanceApiResponse {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

/* =========================================================
   🔥 MAPPER (Backend → Frontend)
========================================================= */

const mapMaintenance = (req: any): MaintenanceRequest => {
  return {
    id: String(req.id),
    ticketNumber: req.ticketNumber ?? `MT-${req.id}`,

    tenantId: req.tenant?.id ? String(req.tenant.id) : "",
    tenantName: req.tenant
  ? `${req.tenant.firstName ?? ""} ${req.tenant.lastName ?? ""}`.trim()
  : "",

    unitId: req.unitId ? String(req.unitId) : "",
    unitNumber: req.unitNumber ?? "",

    propertyId: req.propertyId ? String(req.propertyId) : "",
    propertyName: req.propertyName ?? "",

    category: req.category?.toLowerCase() as MaintenanceCategory,
    priority: req.priority?.toLowerCase() as MaintenancePriority,
    status: req.status?.toLowerCase() as MaintenanceStatus,

    title: req.title,
    description: req.description,

    photos: req.photos ?? [],

    assignedTo: req.assignedTo ? String(req.assignedTo) : undefined,
    assignedToName: req.assignedToName ?? undefined,

    estimatedCost: req.estimatedCost ?? undefined,
    actualCost: req.actualCost ?? undefined,

    scheduledDate: req.scheduledDate ?? undefined,
    completedDate: req.completedDate ?? undefined,

    notes:
      req.notes?.map((note: any) => ({
        id: String(note.id),
        requestId: String(note.requestId),
        userId: String(note.userId),
        userName: note.userName,
        userRole: note.userRole?.toLowerCase(),
        content: note.content,
        createdAt: note.createdAt,
      })) ?? [],

    createdAt: req.createdAt,
    updatedAt: req.updatedAt,
  };
};

/* =========================================================
   🚀 SERVICE METHODS
========================================================= */

/* =========================
   📄 Get Requests
========================= */
export const getMaintenanceRequests = async (): Promise<MaintenanceRequest[]> => {
  const resp = await apiRequest<null, any[]>({
    path: API_PATHS.MAINTENANCE,
    method: "GET",
  });

  return resp?.map(mapMaintenance) ?? [];
};


/* =========================
   ➕ Create Request
========================= */
export const createMaintenanceRequest = async (
  data: MaintenanceFormData
): Promise<MaintenanceRequest> => {

  const resp = await apiRequest<MaintenanceFormData, any>({
    path: API_PATHS.CREATE_MAINTENANCE,
    method: "POST",
    body: data,
  });

  return mapMaintenance(resp);
};


/* =========================
   👷 Assign Request
========================= */
export const assignMaintenanceRequest = async (
  data: AssignmentFormData
): Promise<MaintenanceRequest> => {

  const resp = await apiRequest<AssignmentFormData, any>({
    path: API_PATHS.ASSIGN_MAINTENANCE,
    method: "POST",
    body: data,
  });

  return mapMaintenance(resp);
};


/* =========================
   🔄 Update Status
========================= */
export const updateMaintenanceStatus = async (
  id: string,
  status: MaintenanceStatus
): Promise<MaintenanceRequest> => {

  const resp = await apiRequest<null, any>({
    path: `${API_PATHS.UPDATE_MAINTENANCE_STATUS(Number(id))}?status=${status.toUpperCase()}`,
    method: "PATCH",
  });

  return mapMaintenance(resp);
};


/* =========================
   📝 Add Note
========================= */
export const addMaintenanceNote = async (
  requestId: string,
  content: string
): Promise<MaintenanceNote> => {

  return await apiRequest<
    { requestId: number; content: string },
    MaintenanceNote
  >({
    path: API_PATHS.ADD_MAINTENANCE_NOTE,
    method: "POST",
    body: {
      requestId: Number(requestId),
      content,
    },
  });
};