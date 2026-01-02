import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { sendWaterReadingEmail } from '@/services/emailService';
import { shouldSendNotification } from '@/hooks/useNotificationPreferences';

export type WaterReadingStatus = 'pending' | 'approved' | 'rejected';

export interface WaterReading {
  id: string;
  unitId: string;
  unitNumber: string;
  propertyName: string;
  propertyId: string;
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

// Mock water readings data with propertyId
const mockWaterReadings: WaterReading[] = [
  {
    id: 'wr-1',
    unitId: 'u1',
    unitNumber: 'A101',
    propertyName: 'Sunset Apartments',
    propertyId: '1',
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
    propertyName: 'Sunset Apartments',
    propertyId: '1',
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
    propertyName: 'Sunset Apartments',
    propertyId: '1',
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
    propertyName: 'Garden View Residences',
    propertyId: '2',
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
    propertyName: 'Kilimani Heights',
    propertyId: '3',
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

// Notification helper that doesn't require hooks
const addWaterNotification = (data: {
  userId: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  link?: string;
}) => {
  const NOTIF_KEY = 'in_app_notifications';
  try {
    const stored = localStorage.getItem(NOTIF_KEY);
    const notifications = stored ? JSON.parse(stored) : [];
    const newNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      read: false,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(NOTIF_KEY, JSON.stringify([newNotification, ...notifications].slice(0, 100)));
  } catch {
    // Ignore
  }
};

export function useWaterData() {
  const { user } = useAuth();
  const [readings, setReadings] = useState<WaterReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const allReadings = getStoredReadings();
    // Filter readings based on user role and assigned properties
    let filteredReadings = allReadings;
    
    if (user?.role === 'employee' && user.assignedPropertyId) {
      // Employees only see readings for their assigned property
      filteredReadings = allReadings.filter(r => r.propertyId === user.assignedPropertyId);
    } else if (user?.role === 'tenant') {
      // Tenants don't see water readings in this context
      filteredReadings = [];
    }
    // Landlords and super admin see all readings
    
    setReadings(filteredReadings);
    setIsLoading(false);
  }, [user]);

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
      status: isLandlord ? 'approved' : 'pending',
      approvedBy: isLandlord ? `${user.firstName} ${user.lastName}` : undefined,
      approvedAt: isLandlord ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };

    const allReadings = getStoredReadings();
    const updated = [newReading, ...allReadings];
    saveReadings(updated);
    setReadings(prev => [newReading, ...prev]);
    setIsLoading(false);

    // Send notification to landlords when employee adds a reading
    if (!isLandlord) {
      addWaterNotification({
        userId: 'landlord',
        title: 'New Water Reading Pending Approval',
        message: `${user.firstName} ${user.lastName} submitted a water reading for ${data.unitNumber} at ${data.propertyName}. Consumption: ${consumption} units.`,
        category: 'water_reading_pending',
        priority: 'medium',
        link: '/water-data',
      });
      
      // Send email notification if enabled
      if (shouldSendNotification('landlord', 'email', 'waterReadings')) {
        sendWaterReadingEmail({
          recipientName: 'Property Manager',
          recipientEmail: 'manager@property.com',
          unitNumber: data.unitNumber,
          propertyName: data.propertyName,
          consumption,
          totalAmount,
          status: 'pending',
          submittedBy: `${user.firstName} ${user.lastName}`,
        });
      }
    }

    return newReading;
  }, [user, canAddReading]);

  const approveReading = useCallback((readingId: string) => {
    if (!user || !canApprove) return false;

    const allReadings = getStoredReadings();
    const reading = allReadings.find(r => r.id === readingId);
    
    const updated = allReadings.map(r => {
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

    saveReadings(updated);
    setReadings(prev => prev.map(r => {
      if (r.id === readingId) {
        return updated.find(u => u.id === readingId) || r;
      }
      return r;
    }));

    // Notify the employee who submitted
    if (reading && reading.recordedByRole === 'employee') {
      addWaterNotification({
        userId: 'employee',
        title: 'Water Reading Approved',
        message: `Your water reading for ${reading.unitNumber} at ${reading.propertyName} has been approved by ${user.firstName} ${user.lastName}.`,
        category: 'water_reading_approved',
        priority: 'low',
        link: '/water-data',
      });
      
      // Send email notification if enabled
      if (shouldSendNotification('employee', 'email', 'waterReadings')) {
        sendWaterReadingEmail({
          recipientName: reading.recordedBy,
          recipientEmail: 'employee@property.com',
          unitNumber: reading.unitNumber,
          propertyName: reading.propertyName,
          consumption: reading.consumption,
          totalAmount: reading.totalAmount,
          status: 'approved',
          approvedBy: `${user.firstName} ${user.lastName}`,
        });
      }
    }

    return true;
  }, [user, canApprove]);

  const rejectReading = useCallback((readingId: string, reason: string) => {
    if (!user || !canApprove) return false;

    const allReadings = getStoredReadings();
    const reading = allReadings.find(r => r.id === readingId);

    const updated = allReadings.map(r => {
      if (r.id === readingId && r.status === 'pending') {
        return {
          ...r,
          status: 'rejected' as WaterReadingStatus,
          rejectionReason: reason,
        };
      }
      return r;
    });

    saveReadings(updated);
    setReadings(prev => prev.map(r => {
      if (r.id === readingId) {
        return updated.find(u => u.id === readingId) || r;
      }
      return r;
    }));

    // Notify the employee who submitted
    if (reading && reading.recordedByRole === 'employee') {
      addWaterNotification({
        userId: 'employee',
        title: 'Water Reading Rejected',
        message: `Your water reading for ${reading.unitNumber} at ${reading.propertyName} was rejected. Reason: ${reason}`,
        category: 'water_reading_rejected',
        priority: 'high',
        link: '/water-data',
      });
      
      // Send email notification if enabled
      if (shouldSendNotification('employee', 'email', 'waterReadings')) {
        sendWaterReadingEmail({
          recipientName: reading.recordedBy,
          recipientEmail: 'employee@property.com',
          unitNumber: reading.unitNumber,
          propertyName: reading.propertyName,
          consumption: reading.consumption,
          totalAmount: reading.totalAmount,
          status: 'rejected',
          rejectionReason: reason,
        });
      }
    }

    return true;
  }, [user, canApprove]);

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
