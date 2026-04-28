import { useEffect, useState } from "react";
import { fetchMyLandlordProfile } from "@/api/service/landlords.service.api";
import {
  mapLandlordDto,
  normalizeBackendSubscription,
} from "@/api/mapper/landlord.mapper";
import { fetchMySubscription } from "@/api/service/subscription.service";
import { LandlordTypes } from "@/types/LandlordTypes";

export function useMyLandlord() {
  const [landlord, setLandlord] = useState<LandlordTypes | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    try {
      setIsLoading(true);

      const [landlordDto, subscriptionDto] = await Promise.all([
        fetchMyLandlordProfile(),
        fetchMySubscription(),
      ]);

      const baseLandlord = mapLandlordDto(landlordDto);

      const mergedLandlord: LandlordTypes = {
        ...baseLandlord,
        subscription: subscriptionDto
          ? normalizeBackendSubscription(subscriptionDto.plan)
          : "BASIC",
        subscriptionStartDate: subscriptionDto?.startDate ?? null,
        subscriptionEndDate: subscriptionDto?.endDate ?? null,
        maxProperties: subscriptionDto?.maxProperties ?? 0,
        maxUnits: subscriptionDto?.maxUnits ?? 0,
        billingCycle: subscriptionDto?.billingCycle ?? "MONTHLY",
      };

      setLandlord(mergedLandlord);
    } catch (error) {
      console.error("[useMyLandlord] failed", error);
      setLandlord(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return {
    landlord,
    isLoading,
    refetch: load, // ✅ THIS is what you were missing
  };
}