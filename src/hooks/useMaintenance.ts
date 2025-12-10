import { useState, useCallback } from 'react';
import type { MaintenanceRequest, MaintenanceNote, MaintenanceFormData, AssignmentFormData, MaintenanceStatus } from '@/types/maintenance';

const mockRequests: MaintenanceRequest[] = [
  {
    id: '1',
    ticketNumber: 'MNT-2024-001',
    tenantId: 't1',
    tenantName: 'John Doe',
    unitId: 'u1',
    unitNumber: 'A101',
    propertyId: 'p1',
    propertyName: 'Sunrise Apartments',
    category: 'plumbing',
    priority: 'high',
    status: 'in_progress',
    title: 'Leaking faucet in bathroom',
    description: 'The bathroom sink faucet has been leaking for two days. Water is dripping continuously.',
    photos: [],
    assignedTo: 'e1',
    assignedToName: 'Bob the Plumber',
    estimatedCost: 150,
    scheduledDate: '2024-01-15',
    notes: [
      {
        id: 'n1',
        requestId: '1',
        userId: 'e1',
        userName: 'Bob the Plumber',
        userRole: 'employee',
        content: 'Inspected the faucet. Need to replace washer and cartridge.',
        createdAt: '2024-01-14T10:00:00Z',
      },
    ],
    createdAt: '2024-01-12T08:00:00Z',
    updatedAt: '2024-01-14T10:00:00Z',
  },
  {
    id: '2',
    ticketNumber: 'MNT-2024-002',
    tenantId: 't2',
    tenantName: 'Jane Smith',
    unitId: 'u2',
    unitNumber: 'B202',
    propertyId: 'p1',
    propertyName: 'Sunrise Apartments',
    category: 'electrical',
    priority: 'urgent',
    status: 'pending',
    title: 'Power outlet not working',
    description: 'The power outlet in the living room stopped working. No power to any device plugged in.',
    photos: [],
    notes: [],
    createdAt: '2024-01-14T14:00:00Z',
    updatedAt: '2024-01-14T14:00:00Z',
  },
  {
    id: '3',
    ticketNumber: 'MNT-2024-003',
    tenantId: 't3',
    tenantName: 'Mike Johnson',
    unitId: 'u3',
    unitNumber: 'C303',
    propertyId: 'p2',
    propertyName: 'Ocean View Towers',
    category: 'hvac',
    priority: 'medium',
    status: 'resolved',
    title: 'AC not cooling properly',
    description: 'Air conditioner is running but not cooling the room effectively.',
    photos: [],
    assignedTo: 'e2',
    assignedToName: 'AC Services Inc.',
    estimatedCost: 200,
    actualCost: 180,
    scheduledDate: '2024-01-10',
    completedDate: '2024-01-10',
    notes: [
      {
        id: 'n2',
        requestId: '3',
        userId: 'e2',
        userName: 'AC Services Inc.',
        userRole: 'employee',
        content: 'Cleaned filters and recharged refrigerant. AC working normally now.',
        createdAt: '2024-01-10T16:00:00Z',
      },
    ],
    createdAt: '2024-01-08T09:00:00Z',
    updatedAt: '2024-01-10T16:00:00Z',
  },
  {
    id: '4',
    ticketNumber: 'MNT-2024-004',
    tenantId: 't1',
    tenantName: 'John Doe',
    unitId: 'u1',
    unitNumber: 'A101',
    propertyId: 'p1',
    propertyName: 'Sunrise Apartments',
    category: 'appliance',
    priority: 'low',
    status: 'assigned',
    title: 'Dishwasher making noise',
    description: 'The dishwasher makes a loud grinding noise during the wash cycle.',
    photos: [],
    assignedTo: 'e3',
    assignedToName: 'Appliance Repair Co.',
    scheduledDate: '2024-01-20',
    notes: [],
    createdAt: '2024-01-13T11:00:00Z',
    updatedAt: '2024-01-14T09:00:00Z',
  },
];

// Mock employees - in production, this would come from useEmployees
const getDefaultEmployees = () => {
  const storedEmployees = localStorage.getItem('employees');
  if (storedEmployees) {
    const employees = JSON.parse(storedEmployees);
    return employees
      .filter((e: any) => e.status === 'active')
      .map((e: any) => ({
        id: e.id,
        name: `${e.firstName} ${e.lastName}`,
        specialty: e.role || 'General',
      }));
  }
  return [
    { id: 'e1', name: 'Bob the Plumber', specialty: 'Plumbing' },
    { id: 'e2', name: 'AC Services Inc.', specialty: 'HVAC' },
    { id: 'e3', name: 'Appliance Repair Co.', specialty: 'Appliances' },
    { id: 'e4', name: 'Quick Electric', specialty: 'Electrical' },
  ];
};

export function useMaintenance() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>(mockRequests);
  const [isLoading, setIsLoading] = useState(false);

  const createRequest = useCallback((data: MaintenanceFormData, tenantId: string, tenantName: string) => {
    setIsLoading(true);
    const newRequest: MaintenanceRequest = {
      id: `mnt-${Date.now()}`,
      ticketNumber: `MNT-2024-${String(requests.length + 1).padStart(3, '0')}`,
      tenantId,
      tenantName,
      unitId: data.unitId,
      unitNumber: 'A101',
      propertyId: 'p1',
      propertyName: 'Sunrise Apartments',
      category: data.category,
      priority: data.priority,
      status: 'pending',
      title: data.title,
      description: data.description,
      photos: [],
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRequests((prev) => [...prev, newRequest]);
    setIsLoading(false);
    return newRequest;
  }, [requests.length]);

  const assignRequest = useCallback((data: AssignmentFormData) => {
    setIsLoading(true);
    const employees = getDefaultEmployees();
    const employee = employees.find((e: any) => e.id === data.assignedTo);
    
    setRequests((prev) =>
      prev.map((req) =>
        req.id === data.requestId
          ? {
              ...req,
              status: 'assigned' as MaintenanceStatus,
              assignedTo: data.assignedTo,
              assignedToName: employee?.name,
              scheduledDate: data.scheduledDate,
              estimatedCost: data.estimatedCost,
              updatedAt: new Date().toISOString(),
              notes: data.notes
                ? [
                    ...req.notes,
                    {
                      id: `note-${Date.now()}`,
                      requestId: req.id,
                      userId: 'landlord',
                      userName: 'Property Manager',
                      userRole: 'landlord' as const,
                      content: data.notes,
                      createdAt: new Date().toISOString(),
                    },
                  ]
                : req.notes,
            }
          : req
      )
    );
    setIsLoading(false);
  }, []);

  const updateStatus = useCallback((requestId: string, status: MaintenanceStatus, note?: string, actualCost?: number) => {
    setIsLoading(true);
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status,
              actualCost: actualCost ?? req.actualCost,
              completedDate: status === 'resolved' ? new Date().toISOString().split('T')[0] : req.completedDate,
              updatedAt: new Date().toISOString(),
              notes: note
                ? [
                    ...req.notes,
                    {
                      id: `note-${Date.now()}`,
                      requestId: req.id,
                      userId: 'landlord',
                      userName: 'Property Manager',
                      userRole: 'landlord' as const,
                      content: note,
                      createdAt: new Date().toISOString(),
                    },
                  ]
                : req.notes,
            }
          : req
      )
    );
    setIsLoading(false);
  }, []);

  const addNote = useCallback((requestId: string, content: string, userId: string, userName: string, userRole: 'landlord' | 'employee' | 'tenant') => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              updatedAt: new Date().toISOString(),
              notes: [
                ...req.notes,
                {
                  id: `note-${Date.now()}`,
                  requestId,
                  userId,
                  userName,
                  userRole,
                  content,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : req
      )
    );
  }, []);

  const getRequestsByStatus = useCallback((status: MaintenanceStatus) => {
    return requests.filter((req) => req.status === status);
  }, [requests]);

  const getRequestsByPriority = useCallback((priority: MaintenanceRequest['priority']) => {
    return requests.filter((req) => req.priority === priority);
  }, [requests]);

  const getEmployees = useCallback(() => getDefaultEmployees(), []);

  return {
    requests,
    isLoading,
    createRequest,
    assignRequest,
    updateStatus,
    addNote,
    getRequestsByStatus,
    getRequestsByPriority,
    getEmployees,
  };
}
