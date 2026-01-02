import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type WaterReadingStatus = 'pending' | 'approved' | 'rejected';

export interface WaterReading {
  id: string;
  unitId: string;
  unitNumber: string;
  propertyName: string;
  tenantName: string;
  meterId: string;
  previousReading: number;
  currentReading: number;
  consumption: number;
  ratePerUnit: number;
  totalAmount: number;
  readingDate: string;
  billingPeriod: string;
  recordedBy: string;
  recordedByRole: 'employee' | 'landlord';
  status: WaterReadingStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

const STORAGE_KEY = 'water_readings';

// Mock water readings data
const mockWaterReadings: WaterReading[] = [
  {
    id: 'wr-1',
    unitId: 'u1',
    unitNumber: 'A101',
    propertyName: 'Sunrise Apartments',
    tenantName: 'John Doe',
    meterId: 'WM-001',
    previousReading: 1200,
    currentReading: 1250,
    consumption: 50,
    ratePerUnit: 1.5,
    totalAmount: 75,
    readingDate: '2024-01-15',
    billingPeriod: 'January 2024',
    recordedBy: 'James Kamau',
    recordedByRole: 'employee',
    status: 'approved',
    approvedBy: 'Property Manager',
    approvedAt: '2024-01-16T10:00:00Z',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'wr-2',
    unitId: 'u1',
    unitNumber: 'A101',
    propertyName: 'Sunrise Apartments',
    tenantName: 'John Doe',
    meterId: 'WM-001',
    previousReading: 1150,
    currentReading: 1200,
    consumption: 50,
    ratePerUnit: 1.5,
    totalAmount: 75,
    readingDate: '2023-12-15',
    billingPeriod: 'December 2023',
    recordedBy: 'James Kamau',
    recordedByRole: 'employee',
    status: 'approved',
    approvedBy: 'Property Manager',
    approvedAt: '2023-12-16T10:00:00Z',
    createdAt: '2023-12-15T10:00:00Z',
  },
  {
    id: 'wr-3',
    unitId: 'u2',
    unitNumber: 'B202',
    propertyName: 'Sunrise Apartments',
    tenantName: 'Jane Smith',
    meterId: 'WM-002',
    previousReading: 800,
    currentReading: 865,
    consumption: 65,
    ratePerUnit: 1.5,
    totalAmount: 97.5,
    readingDate: '2024-01-15',
    billingPeriod: 'January 2024',
    recordedBy: 'James Kamau',
    recordedByRole: 'employee',
    status: 'pending',
    createdAt: '2024-01-15T11:00:00Z',
  },
  {
    id: 'wr-4',
    unitId: 'u3',
    unitNumber: 'C303',
    propertyName: 'Ocean View Towers',
    tenantName: 'Mike Johnson',
    meterId: 'WM-003',
    previousReading: 500,
    currentReading: 580,
    consumption: 80,
    ratePerUnit: 1.5,
    totalAmount: 120,
    readingDate: '2024-01-15',
    billingPeriod: 'January 2024',
    recordedBy: 'Property Manager',
    recordedByRole: 'landlord',
    status: 'approved',
    approvedBy: 'Property Manager',
    approvedAt: '2024-01-15T12:00:00Z',
    createdAt: '2024-01-15T12:00:00Z',
  },
  {
    id: 'wr-5',
    unitId: 'u4',
    unitNumber: 'D404',
    propertyName: 'Ocean View Towers',
    tenantName: 'Sarah Wilson',
    meterId: 'WM-004',
    previousReading: 320,
    currentReading: 375,
    consumption: 55,
    ratePerUnit: 1.5,
    totalAmount: 82.5,
    readingDate: '2024-01-16',
    billingPeriod: 'January 2024',
    recordedBy: 'James Kamau',
    recordedByRole: 'employee',
    status: 'pending',
    createdAt: '2024-01-16T09:00:00Z',
  },
];

const getStoredReadings = (): WaterReading[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockWaterReadings));
  return mockWaterReadings;
};

const saveReadings = (readings: WaterReading[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
};

export function useWaterData() {
  const { user } = useAuth();
  const [readings, setReadings] = useState<WaterReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setReadings(getStoredReadings());
    setIsLoading(false);
  }, []);

  const canAddReading = user?.role === 'employee' || user?.role === 'landlord';
  const canApprove = user?.role === 'landlord';

  const addReading = useCallback((data: Omit<WaterReading, 'id' | 'consumption' | 'totalAmount' | 'createdAt' | 'status' | 'recordedByRole'>) => {
    if (!user || !canAddReading) return null;

    setIsLoading(true);
    const consumption = data.currentReading - data.previousReading;
    const totalAmount = consumption * data.ratePerUnit;
    const isLandlord = user.role === 'landlord';

    const newReading: WaterReading = {
      ...data,
      id: `wr-${Date.now()}`,
      consumption,
      totalAmount,
      recordedByRole: isLandlord ? 'landlord' : 'employee',
      status: isLandlord ? 'approved' : 'pending', // Auto-approve if landlord adds
      approvedBy: isLandlord ? `${user.firstName} ${user.lastName}` : undefined,
      approvedAt: isLandlord ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = [newReading, ...readings];
    setReadings(updated);
    saveReadings(updated);
    setIsLoading(false);
    return newReading;
  }, [readings, user, canAddReading]);

  const approveReading = useCallback((readingId: string) => {
    if (!user || !canApprove) return false;

    const updated = readings.map(r => {
      if (r.id === readingId && r.status === 'pending') {
        return {
          ...r,
          status: 'approved' as WaterReadingStatus,
          approvedBy: `${user.firstName} ${user.lastName}`,
          approvedAt: new Date().toISOString(),
        };
      }
      return r;
    });

    setReadings(updated);
    saveReadings(updated);
    return true;
  }, [readings, user, canApprove]);

  const rejectReading = useCallback((readingId: string, reason: string) => {
    if (!user || !canApprove) return false;

    const updated = readings.map(r => {
      if (r.id === readingId && r.status === 'pending') {
        return {
          ...r,
          status: 'rejected' as WaterReadingStatus,
          rejectionReason: reason,
        };
      }
      return r;
    });

    setReadings(updated);
    saveReadings(updated);
    return true;
  }, [readings, user, canApprove]);

  const getPendingReadings = useCallback(() => {
    return readings.filter(r => r.status === 'pending');
  }, [readings]);

  const getApprovedReadings = useCallback(() => {
    return readings.filter(r => r.status === 'approved');
  }, [readings]);

  const getReadingsByUnit = useCallback((unitId: string) => {
    return readings.filter(r => r.unitId === unitId);
  }, [readings]);

  const getReadingsByProperty = useCallback((propertyName: string) => {
    return readings.filter(r => r.propertyName === propertyName);
  }, [readings]);

  const getConsumptionStats = useCallback(() => {
    const approvedReadings = getApprovedReadings();
    const totalConsumption = approvedReadings.reduce((sum, r) => sum + r.consumption, 0);
    const totalRevenue = approvedReadings.reduce((sum, r) => sum + r.totalAmount, 0);
    const avgConsumption = approvedReadings.length > 0 ? totalConsumption / approvedReadings.length : 0;
    
    // Group by month for trend
    const monthlyData = approvedReadings.reduce((acc, r) => {
      const month = r.billingPeriod;
      if (!acc[month]) {
        acc[month] = { consumption: 0, revenue: 0, count: 0 };
      }
      acc[month].consumption += r.consumption;
      acc[month].revenue += r.totalAmount;
      acc[month].count += 1;
      return acc;
    }, {} as Record<string, { consumption: number; revenue: number; count: number }>);

    return {
      totalConsumption,
      totalRevenue,
      avgConsumption,
      monthlyData,
      totalReadings: approvedReadings.length,
      pendingCount: getPendingReadings().length,
    };
  }, [readings, getApprovedReadings, getPendingReadings]);

  const getHighConsumptionUnits = useCallback((threshold: number = 60) => {
    return getApprovedReadings().filter(r => r.consumption > threshold);
  }, [getApprovedReadings]);

  return {
    readings,
    isLoading,
    canAddReading,
    canApprove,
    addReading,
    approveReading,
    rejectReading,
    getPendingReadings,
    getApprovedReadings,
    getReadingsByUnit,
    getReadingsByProperty,
    getConsumptionStats,
    getHighConsumptionUnits,
  };
}
