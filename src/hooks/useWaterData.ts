import { useState, useCallback } from 'react';

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
  createdAt: string;
}

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
    recordedBy: 'James Kamau',
    createdAt: '2024-01-15T12:00:00Z',
  },
];

export function useWaterData() {
  const [readings, setReadings] = useState<WaterReading[]>(mockWaterReadings);
  const [isLoading, setIsLoading] = useState(false);

  const addReading = useCallback((data: Omit<WaterReading, 'id' | 'consumption' | 'totalAmount' | 'createdAt'>) => {
    setIsLoading(true);
    const consumption = data.currentReading - data.previousReading;
    const totalAmount = consumption * data.ratePerUnit;

    const newReading: WaterReading = {
      ...data,
      id: `wr-${Date.now()}`,
      consumption,
      totalAmount,
      createdAt: new Date().toISOString(),
    };

    setReadings(prev => [newReading, ...prev]);
    setIsLoading(false);
    return newReading;
  }, []);

  const getReadingsByUnit = useCallback((unitId: string) => {
    return readings.filter(r => r.unitId === unitId);
  }, [readings]);

  const getReadingsByProperty = useCallback((propertyName: string) => {
    return readings.filter(r => r.propertyName === propertyName);
  }, [readings]);

  const getConsumptionStats = useCallback(() => {
    const totalConsumption = readings.reduce((sum, r) => sum + r.consumption, 0);
    const totalRevenue = readings.reduce((sum, r) => sum + r.totalAmount, 0);
    const avgConsumption = readings.length > 0 ? totalConsumption / readings.length : 0;
    
    // Group by month for trend
    const monthlyData = readings.reduce((acc, r) => {
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
      totalReadings: readings.length,
    };
  }, [readings]);

  const getHighConsumptionUnits = useCallback((threshold: number = 60) => {
    return readings.filter(r => r.consumption > threshold);
  }, [readings]);

  return {
    readings,
    isLoading,
    addReading,
    getReadingsByUnit,
    getReadingsByProperty,
    getConsumptionStats,
    getHighConsumptionUnits,
  };
}
