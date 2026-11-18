import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiHttpError } from "@/api/https";
import { useToast } from "@/hooks/use-toast";
import { metersApi } from "@/api/service/metersApi.service";
import { WaterMeter } from "@/api/dto/WaterMeterDTO";
import { WaterMeterStats } from "@/api/dto/WaterMeterDTO";

export function useMeters() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const [meters, setMeters] = useState<WaterMeter[]>([]);
  const [stats, setStats] = useState<WaterMeterStats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMeters = async () => {
    try {
      setLoading(true);
      const data = await metersApi.fetchAll();
      setMeters(data);
    } catch (error) {
      if (error instanceof ApiHttpError && [401, 403, 423].includes(error.status)) return;
      toast({
        title: "Error",
        description: "Failed to load water meters",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await metersApi.getStats();
      setStats(data);
    } catch (error) {
      if (!(error instanceof ApiHttpError && [401, 403, 423].includes(error.status))) {
        console.warn("Failed to load meter stats", error);
      }
    }
  };

  const createMeter = async (meter: WaterMeter) => {
    try {
      const created = await metersApi.create(meter);

      setMeters((prev) => [...prev, created]);

      toast({
        title: "Meter Added",
        description: `Water meter ${meter.id} created successfully`,
      });

      await loadStats();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create water meter",
        variant: "destructive",
      });
    }
  };

  const updateMeter = async (id: number, meter: WaterMeter) => {
    try {
      const updated = await metersApi.update(id, meter);

      setMeters((prev) =>
        prev.map((m) => (m.id === id ? updated : m))
      );

      toast({
        title: "Meter Updated",
        description: `Water meter ${meter.id} updated successfully`,
      });

      await loadStats();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update meter",
        variant: "destructive",
      });
    }
  };

  const assignMeter = async (meterId: number, unitId: number) => {
  try {
    const updated = await metersApi.assignUnit(meterId, unitId);

    setMeters((prev) =>
      prev.map((m) => (m.id === meterId ? updated : m))
    );

    toast({
      title: "Meter Assigned",
      description: `Meter assigned successfully`,
    });

    // refresh stats and meters
    await loadStats();
    await loadMeters();

  } catch (error) {
    console.error(error);

    toast({
      title: "Error",
      description: "Failed to assign meter",
      variant: "destructive",
    });
  }
};

  const deleteMeter = async (id: number) => {
    try {
      await metersApi.delete(id);

      setMeters((prev) => prev.filter((m) => m.id !== id));

      toast({
        title: "Meter Deleted",
        description: "Water meter removed successfully",
      });

      await loadStats();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete meter",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setMeters([]);
      setStats(null);
      setLoading(false);
      return;
    }
    void loadMeters();
    void loadStats();
  }, [authLoading, user?.id]);

  return {
    meters,
    stats,
    loading,
    createMeter,
    updateMeter,
    assignMeter,
    deleteMeter,
    reload: loadMeters,
  };
}