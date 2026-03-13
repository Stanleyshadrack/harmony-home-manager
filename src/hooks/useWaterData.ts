import { useState, useEffect, useCallback } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { HighUsageResponse, MonthlyWaterStats, WaterReadingResponse, WaterStatsResponse } from "@/api/dto/water.readings.dto";
import { waterReadingsApi } from "@/api/service/water.readings.service";

export function useWaterData() {
  const { user } = useAuth();

  const [readings, setReadings] = useState<WaterReadingResponse[]>([]);
const [stats, setStats] = useState<WaterStatsResponse | null>(null);
const [monthlyStats, setMonthlyStats] = useState<MonthlyWaterStats[]>([]);
const [highUsage, setHighUsage] = useState<HighUsageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canAddReading =
    user?.role === "employee" || user?.role === "landlord";

  const canApprove = user?.role === "landlord";

  /* ================================
     Load All Water Readings
  ================================= */

  const loadReadings = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await waterReadingsApi.fetchAll();

      setReadings(data);
    } catch (error) {
      console.error("Failed to load water readings", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ================================
     Load Stats
  ================================= */

  const loadStats = useCallback(async () => {
    try {
      const stats = await waterReadingsApi.getStats();
      setStats(stats);
    } catch (error) {
      console.error("Failed to load water stats", error);
    }
  }, []);

  /* ================================
     Load Monthly Stats
  ================================= */

  const loadMonthlyStats = useCallback(async () => {
    try {
      const data = await waterReadingsApi.getMonthlyStats();
      setMonthlyStats(data);
    } catch (error) {
      console.error("Failed to load monthly stats", error);
    }
  }, []);

  /* ================================
     Load High Usage
  ================================= */

  const loadHighUsage = useCallback(async () => {
    try {
      const data = await waterReadingsApi.getHighUsage();
      setHighUsage(data);
    } catch (error) {
      console.error("Failed to load high usage data", error);
    }
  }, []);

  /* ================================
     Create Reading
  ================================= */

  const addReading = useCallback(async (data: any) => {
    try {
      const newReading = await waterReadingsApi.create(data);

      setReadings((prev) => [newReading, ...prev]);

      return newReading;
    } catch (error) {
      console.error("Failed to create reading", error);
      return null;
    }
  }, []);

  /* ================================
     Approve Reading
  ================================= */

  const approveReading = useCallback(async (id: number) => {
    try {
      await waterReadingsApi.approve(id);

      await loadReadings();

      return true;
    } catch (error) {
      console.error("Approve failed", error);
      return false;
    }
  }, [loadReadings]);

  /* ================================
     Reject Reading
  ================================= */

  const rejectReading = useCallback(async (id: number) => {
    try {
      await waterReadingsApi.reject(id);

      await loadReadings();

      return true;
    } catch (error) {
      console.error("Reject failed", error);
      return false;
    }
  }, [loadReadings]);

  /* ================================
     Filters
  ================================= */

  const getPendingReadings = () =>
    readings.filter((r: any) => r.status === "PENDING");

  const getApprovedReadings = () =>
    readings.filter((r: any) => r.status === "APPROVED");

  const getReadingsByUnit = (unitId: number) =>
    readings.filter((r) => r.unitId === unitId);

  /* ================================
     Initial Load
  ================================= */

  useEffect(() => {
    loadReadings();
    loadStats();
    loadMonthlyStats();
    loadHighUsage();
  }, [loadReadings, loadStats, loadMonthlyStats, loadHighUsage]);

  return {
    readings,
    stats,
    monthlyStats,
    highUsage,
    isLoading,

    canAddReading,
    canApprove,

    addReading,
    approveReading,
    rejectReading,

    getPendingReadings,
    getApprovedReadings,
    getReadingsByUnit,

    reload: loadReadings,
  };
}