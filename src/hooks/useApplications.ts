import { useState, useEffect } from 'react';
import { UnitApplication, UnitApplicationFormData } from '@/types/application';

const STORAGE_KEY = 'tenant_applications';

const getStoredApplications = (): UnitApplication[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveApplications = (applications: UnitApplication[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
};

export function useApplications() {
  const [applications, setApplications] = useState<UnitApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setApplications(getStoredApplications());
      setIsLoading(false);
    }, 300);
  }, []);

  const submitApplication = async (
    data: UnitApplicationFormData,
    unitNumber: string,
    propertyName: string
  ): Promise<UnitApplication> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const newApplication: UnitApplication = {
      id: Date.now().toString(),
      ...data,
      unitNumber,
      propertyName,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    
    const updated = [...applications, newApplication];
    setApplications(updated);
    saveApplications(updated);
    
    return newApplication;
  };

  const withdrawApplication = async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const updated = applications.map((app) =>
      app.id === id ? { ...app, status: 'withdrawn' as const } : app
    );
    setApplications(updated);
    saveApplications(updated);
  };

  const getApplicationsByEmail = (email: string) => {
    return applications.filter((app) => app.applicantEmail === email);
  };

  return {
    applications,
    isLoading,
    submitApplication,
    withdrawApplication,
    getApplicationsByEmail,
  };
}
