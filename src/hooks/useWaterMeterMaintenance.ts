import { useState, useCallback, useMemo, useEffect } from 'react';
import { addDays, isBefore, isAfter, differenceInDays } from 'date-fns';
export type MaintenanceType = 'calibration' | 'inspection' | 'repair' | 'replacement' | 'cleaning';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export interface MaintenanceSchedule {
  id: string;
  meterId: string;
  meterDisplayId: string;
  propertyName: string;
  unitNumber: string;
  type: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  scheduledDate: Date;
  completedDate?: Date;
  assignedTo?: string;
  notes: string;
  estimatedDuration: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}
export interface MaintenanceAlert {
  id: string;
  meterId: string;
  meterDisplayId: string;
  propertyName: string;
  unitNumber: string;
  type: 'overdue' | 'upcoming' | 'calibration_due' | 'high_consumption';
  message: string;
  priority: MaintenancePriority;
  daysUntilDue?: number;
  createdAt: Date;
  acknowledged: boolean;
}
const STORAGE_KEY = 'water_meter_maintenance';
const ALERTS_KEY = 'water_meter_alerts';
// Mock maintenance schedules
const mockSchedules: MaintenanceSchedule[] = [
  {
    id: 'maint-1',
    meterId: '1',
    meterDisplayId: 'WM-001',
    propertyName: 'Sunset Apartments',
    unitNumber: 'A101',
    type: 'calibration',
    priority: 'medium',
    status: 'scheduled',
    scheduledDate: addDays(new Date(), 7),
    notes: 'Annual calibration check',
    estimatedDuration: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'maint-2',
    meterId: '3',
    meterDisplayId: 'WM-003',
    propertyName: 'Garden View Residences',
    unitNumber: 'B201',
    type: 'repair',
    priority: 'high',
    status: 'overdue',
    scheduledDate: addDays(new Date(), -3),
    notes: 'Meter showing inconsistent readings',
    estimatedDuration: 120,
    createdAt: addDays(new Date(), -10),
    updatedAt: new Date(),
  },
  {
    id: 'maint-3',
    meterId: '2',
    meterDisplayId: 'WM-002',
    propertyName: 'Sunset Apartments',
    unitNumber: 'A102',
    type: 'inspection',
    priority: 'low',
    status: 'completed',
    scheduledDate: addDays(new Date(), -14),
    completedDate: addDays(new Date(), -12),
    assignedTo: 'John Technician',
    notes: 'Routine quarterly inspection',
    estimatedDuration: 30,
    createdAt: addDays(new Date(), -20),
    updatedAt: addDays(new Date(), -12),
  },
  {
    id: 'maint-4',
    meterId: '5',
    meterDisplayId: 'WM-005',
    propertyName: 'Kilimani Heights',
    unitNumber: 'C301',
    type: 'cleaning',
    priority: 'low',
    status: 'scheduled',
    scheduledDate: addDays(new Date(), 14),
    notes: 'Smart meter sensor cleaning',
    estimatedDuration: 45,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
const getStoredSchedules = (): MaintenanceSchedule[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((s: any) => ({
        ...s,
        scheduledDate: new Date(s.scheduledDate),
        completedDate: s.completedDate ? new Date(s.completedDate) : undefined,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      }));
    }
  } catch {
    // Ignore
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSchedules));
  return mockSchedules;
};
const saveSchedules = (schedules: MaintenanceSchedule[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
};
const getStoredAlerts = (): MaintenanceAlert[] => {
  try {
    const stored = localStorage.getItem(ALERTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((a: any) => ({
        ...a,
        createdAt: new Date(a.createdAt),
      }));
    }
  } catch {
    // Ignore
  }
  return [];
};
const saveAlerts = (alerts: MaintenanceAlert[]) => {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
};
export function useWaterMeterMaintenance() {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Load data on mount
  useEffect(() => {
    setSchedules(getStoredSchedules());
    setAlerts(getStoredAlerts());
    setIsLoading(false);
  }, []);
  // Generate alerts based on schedules
  const generateAlerts = useCallback((currentSchedules: MaintenanceSchedule[]) => {
    const today = new Date();
    const newAlerts: MaintenanceAlert[] = [];
    currentSchedules.forEach(schedule => {
      if (schedule.status === 'completed' || schedule.status === 'cancelled') return;
      const daysUntilDue = differenceInDays(schedule.scheduledDate, today);
      // Overdue maintenance
      if (daysUntilDue < 0 && schedule.status !== 'in_progress') {
        newAlerts.push({
          id: `alert-overdue-${schedule.id}`,
          meterId: schedule.meterId,
          meterDisplayId: schedule.meterDisplayId,
          propertyName: schedule.propertyName,
          unitNumber: schedule.unitNumber,
          type: 'overdue',
          message: `${schedule.type} maintenance is ${Math.abs(daysUntilDue)} days overdue`,
          priority: 'critical',
          daysUntilDue,
          createdAt: new Date(),
          acknowledged: false,
        });
      }
      // Upcoming maintenance within 7 days
      else if (daysUntilDue >= 0 && daysUntilDue <= 7) {
        newAlerts.push({
          id: `alert-upcoming-${schedule.id}`,
          meterId: schedule.meterId,
          meterDisplayId: schedule.meterDisplayId,
          propertyName: schedule.propertyName,
          unitNumber: schedule.unitNumber,
          type: 'upcoming',
          message: daysUntilDue === 0 
            ? `${schedule.type} maintenance is due today`
            : `${schedule.type} maintenance due in ${daysUntilDue} days`,
          priority: daysUntilDue <= 2 ? 'high' : 'medium',
          daysUntilDue,
          createdAt: new Date(),
          acknowledged: false,
        });
      }
    });
    return newAlerts;
  }, []);
  // Update alerts when schedules change
  useEffect(() => {
    if (!isLoading) {
      const newAlerts = generateAlerts(schedules);
      setAlerts(newAlerts);
      saveAlerts(newAlerts);
    }
  }, [schedules, isLoading, generateAlerts]);
  // Add new maintenance schedule
  const addSchedule = useCallback((data: Omit<MaintenanceSchedule, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const newSchedule: MaintenanceSchedule = {
      ...data,
      id: `maint-${Date.now()}`,
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updated = [...schedules, newSchedule];
    setSchedules(updated);
    saveSchedules(updated);
    return newSchedule;
  }, [schedules]);
  // Update maintenance schedule
  const updateSchedule = useCallback((id: string, data: Partial<MaintenanceSchedule>) => {
    const updated = schedules.map(s => 
      s.id === id 
        ? { ...s, ...data, updatedAt: new Date() }
        : s
    );
    setSchedules(updated);
    saveSchedules(updated);
  }, [schedules]);
  // Delete maintenance schedule
  const deleteSchedule = useCallback((id: string) => {
    const updated = schedules.filter(s => s.id !== id);
    setSchedules(updated);
    saveSchedules(updated);
  }, [schedules]);
  // Mark schedule as complete
  const completeSchedule = useCallback((id: string, notes?: string) => {
    updateSchedule(id, {
      status: 'completed',
      completedDate: new Date(),
      notes: notes || schedules.find(s => s.id === id)?.notes || '',
    });
  }, [schedules, updateSchedule]);
  // Start maintenance (change status to in_progress)
  const startMaintenance = useCallback((id: string) => {
    updateSchedule(id, { status: 'in_progress' });
  }, [updateSchedule]);
  // Cancel maintenance
  const cancelSchedule = useCallback((id: string) => {
    updateSchedule(id, { status: 'cancelled' });
  }, [updateSchedule]);
  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    const updated = alerts.map(a => 
      a.id === alertId ? { ...a, acknowledged: true } : a
    );
    setAlerts(updated);
    saveAlerts(updated);
  }, [alerts]);
  // Get schedules for a specific meter
  const getSchedulesByMeter = useCallback((meterId: string) => {
    return schedules.filter(s => s.meterId === meterId);
  }, [schedules]);
  // Get alerts for a specific meter
  const getAlertsByMeter = useCallback((meterId: string) => {
    return alerts.filter(a => a.meterId === meterId);
  }, [alerts]);
  // Get pending (non-completed) schedules
  const pendingSchedules = useMemo(() => {
    return schedules.filter(s => 
      s.status === 'scheduled' || s.status === 'in_progress' || s.status === 'overdue'
    );
  }, [schedules]);
  // Get overdue schedules
  const overdueSchedules = useMemo(() => {
    const today = new Date();
    return schedules.filter(s => 
      (s.status === 'scheduled' || s.status === 'overdue') && 
      isBefore(s.scheduledDate, today)
    );
  }, [schedules]);
  // Get upcoming schedules (next 7 days)
  const upcomingSchedules = useMemo(() => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    return schedules.filter(s => 
      s.status === 'scheduled' && 
      isAfter(s.scheduledDate, today) &&
      isBefore(s.scheduledDate, nextWeek)
    );
  }, [schedules]);
  // Get unacknowledged alerts
  const unacknowledgedAlerts = useMemo(() => {
    return alerts.filter(a => !a.acknowledged);
  }, [alerts]);
  // Stats
  const stats = useMemo(() => ({
    total: schedules.length,
    pending: pendingSchedules.length,
    overdue: overdueSchedules.length,
    upcoming: upcomingSchedules.length,
    completed: schedules.filter(s => s.status === 'completed').length,
    alertCount: unacknowledgedAlerts.length,
  }), [schedules, pendingSchedules, overdueSchedules, upcomingSchedules, unacknowledgedAlerts]);
  return {
    schedules,
    alerts,
    isLoading,
    stats,
    pendingSchedules,
    overdueSchedules,
    upcomingSchedules,
    unacknowledgedAlerts,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    completeSchedule,
    startMaintenance,
    cancelSchedule,
    acknowledgeAlert,
    getSchedulesByMeter,
    getAlertsByMeter,
  };
}