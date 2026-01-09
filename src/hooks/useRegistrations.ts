import { useState, useEffect } from 'react';
import { UserRole } from '@/contexts/AuthContext';

export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface PendingRegistration {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  idNumber: string;
  // Tenant-only optional fields
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  relationship?: string;
  termsAccepted: boolean;
  requestedRole: UserRole;
  status: RegistrationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

const STORAGE_KEY = 'pending_registrations';

const getStoredRegistrations = (): PendingRegistration[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRegistrations = (registrations: PendingRegistration[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
};

export function usePendingRegistrations() {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setRegistrations(getStoredRegistrations());
      setIsLoading(false);
    }, 300);
  }, []);

  const submitRegistration = async (
    data: Omit<PendingRegistration, 'id' | 'status' | 'submittedAt'>
  ): Promise<PendingRegistration> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newRegistration: PendingRegistration = {
      id: Date.now().toString(),
      ...data,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    const updated = [...registrations, newRegistration];
    setRegistrations(updated);
    saveRegistrations(updated);

    return newRegistration;
  };

  const approveRegistration = async (id: string, reviewedBy: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const updated = registrations.map((reg) =>
      reg.id === id
        ? {
            ...reg,
            status: 'approved' as RegistrationStatus,
            reviewedAt: new Date().toISOString(),
            reviewedBy,
          }
        : reg
    );
    setRegistrations(updated);
    saveRegistrations(updated);
  };

  const rejectRegistration = async (
    id: string,
    reviewedBy: string,
    reason: string
  ): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const updated = registrations.map((reg) =>
      reg.id === id
        ? {
            ...reg,
            status: 'rejected' as RegistrationStatus,
            reviewedAt: new Date().toISOString(),
            reviewedBy,
            rejectionReason: reason,
          }
        : reg
    );
    setRegistrations(updated);
    saveRegistrations(updated);
  };

  const getPendingByRole = (role: UserRole) => {
    return registrations.filter((r) => r.requestedRole === role && r.status === 'pending');
  };

  const getPendingCount = () => {
    return registrations.filter((r) => r.status === 'pending').length;
  };

  return {
    registrations,
    isLoading,
    submitRegistration,
    approveRegistration,
    rejectRegistration,
    getPendingByRole,
    getPendingCount,
  };
}
