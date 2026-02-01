import { useQuery } from "@tanstack/react-query";
import { PropertyUnitsApi } from "@/api/service/PropertyUnitsApi";
import { mapUnitFromApi } from "@/hooks/useProperties";
import { Unit } from "@/types/property";

export function useAvailableUnits(propertyId?: string | number) {
  return useQuery<Unit[]>({
    queryKey: ["available-units", propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const res = await PropertyUnitsApi.fetchAvailableByProperty(propertyId);
      return res.map(mapUnitFromApi);
    },
    enabled: !!propertyId, // 🔑 do not fire without propertyId
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
