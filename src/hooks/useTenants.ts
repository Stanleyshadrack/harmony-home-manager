import { useState, useEffect } from 'react';
import { Tenant, Lease, TenantDocument, TenantFormData, LeaseFormData } from '@/types/tenant';

const mockTenants: Tenant[] = [
  {
    id: '1',
    userId: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+254712345678',
    emergencyContact: 'Jane Doe',
    emergencyPhone: '+254712345679',
    unitId: '1',
    unitNumber: 'A101',
    propertyName: 'Sunrise Apartments',
    status: 'active',
    moveInDate: '2024-01-15',
    createdAt: '2024-01-10',
  },
  {
    id: '2',
    userId: 'user-2',
    firstName: 'Mary',
    lastName: 'Wanjiku',
    email: 'mary.wanjiku@email.com',
    phone: '+254723456789',
    unitId: '2',
    unitNumber: 'B202',
    propertyName: 'Sunrise Apartments',
    status: 'active',
    moveInDate: '2024-02-01',
    createdAt: '2024-01-25',
  },
  {
    id: '3',
    userId: 'user-3',
    firstName: 'Peter',
    lastName: 'Ochieng',
    email: 'peter.ochieng@email.com',
    phone: '+254734567890',
    unitId: '3',
    unitNumber: 'C301',
    propertyName: 'Ocean View Residences',
    status: 'pending',
    moveInDate: '2024-03-01',
    createdAt: '2024-02-20',
  },
];

const mockLeases: Lease[] = [
  {
    id: '1',
    tenantId: '1',
    unitId: '1',
    startDate: '2024-01-15',
    endDate: '2025-01-14',
    monthlyRent: 25000,
    securityDeposit: 50000,
    status: 'active',
    signedAt: '2024-01-10',
    createdAt: '2024-01-10',
  },
  {
    id: '2',
    tenantId: '2',
    unitId: '2',
    startDate: '2024-02-01',
    endDate: '2025-01-31',
    monthlyRent: 30000,
    securityDeposit: 60000,
    status: 'active',
    signedAt: '2024-01-25',
    createdAt: '2024-01-25',
  },
];

const mockDocuments: TenantDocument[] = [
  {
    id: '1',
    tenantId: '1',
    name: 'National ID.pdf',
    type: 'id',
    url: '/documents/id-1.pdf',
    uploadedAt: '2024-01-10',
    size: 245000,
  },
  {
    id: '2',
    tenantId: '1',
    name: 'Lease Agreement.pdf',
    type: 'lease',
    url: '/documents/lease-1.pdf',
    uploadedAt: '2024-01-10',
    size: 512000,
  },
  {
    id: '3',
    tenantId: '1',
    name: 'Pay Slip.pdf',
    type: 'proof_of_income',
    url: '/documents/income-1.pdf',
    uploadedAt: '2024-01-10',
    size: 178000,
  },
];

export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setTenants(mockTenants);
      setIsLoading(false);
    }, 500);
  }, []);

  const addTenant = async (data: TenantFormData): Promise<Tenant> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newTenant: Tenant = {
      id: Date.now().toString(),
      userId: `user-${Date.now()}`,
      ...data,
      unitNumber: 'NEW',
      propertyName: 'Property',
      status: 'pending',
      moveInDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    setTenants((prev) => [...prev, newTenant]);
    return newTenant;
  };

  const updateTenant = async (id: string, data: Partial<TenantFormData>): Promise<Tenant> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setTenants((prev) =>
      prev.map((tenant) => (tenant.id === id ? { ...tenant, ...data } : tenant))
    );
    return tenants.find((t) => t.id === id)!;
  };

  const deleteTenant = async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setTenants((prev) => prev.filter((tenant) => tenant.id !== id));
  };

  const getTenantsByStatus = (status: Tenant['status']) => {
    return tenants.filter((t) => t.status === status);
  };

  return {
    tenants,
    isLoading,
    addTenant,
    updateTenant,
    deleteTenant,
    getTenantsByStatus,
  };
}

export function useLeases(tenantId?: string) {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLeases(tenantId ? mockLeases.filter((l) => l.tenantId === tenantId) : mockLeases);
      setIsLoading(false);
    }, 300);
  }, [tenantId]);

  const createLease = async (data: LeaseFormData): Promise<Lease> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newLease: Lease = {
      id: Date.now().toString(),
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setLeases((prev) => [...prev, newLease]);
    return newLease;
  };

  const signLease = async (id: string): Promise<Lease> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLeases((prev) =>
      prev.map((lease) =>
        lease.id === id
          ? { ...lease, status: 'active', signedAt: new Date().toISOString() }
          : lease
      )
    );
    return leases.find((l) => l.id === id)!;
  };

  return {
    leases,
    isLoading,
    createLease,
    signLease,
  };
}

export function useTenantDocuments(tenantId: string) {
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setDocuments(mockDocuments.filter((d) => d.tenantId === tenantId));
      setIsLoading(false);
    }, 300);
  }, [tenantId]);

  const uploadDocument = async (
    file: File,
    type: TenantDocument['type']
  ): Promise<TenantDocument> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const newDoc: TenantDocument = {
      id: Date.now().toString(),
      tenantId,
      name: file.name,
      type,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      size: file.size,
    };
    setDocuments((prev) => [...prev, newDoc]);
    return newDoc;
  };

  const deleteDocument = async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  return {
    documents,
    isLoading,
    uploadDocument,
    deleteDocument,
  };
}
