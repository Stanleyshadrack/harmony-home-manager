export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
export type MaintenanceCategory = 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'pest' | 'cleaning' | 'other';

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

export interface MaintenanceNote {
  id: string;
  requestId: string;
  userId: string;
  userName: string;
  userRole: 'landlord' | 'employee' | 'tenant';
  content: string;
  createdAt: string;
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
