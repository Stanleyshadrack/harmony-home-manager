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

  useEffect(() => {
    console.log("[useMyLandlord] mounted");

    const load = async () => {
      try {
        setIsLoading(true);

        console.log("[useMyLandlord] fetching landlord + subscription");

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

          // ✅ NEW
          billingCycle: subscriptionDto?.billingCycle ?? "MONTHLY",
        };

        setLandlord(mergedLandlord);
      } catch (error) {
        console.error("[useMyLandlord] failed to load landlord profile", error);
        setLandlord(null);
      } finally {
        setIsLoading(false);
        console.log("[useMyLandlord] loading finished");
      }
    };

    load();

    return () => {
      console.log("[useMyLandlord] unmounted");
    };
  }, []);

  console.log("[useMyLandlord] render", {
    isLoading,
    landlordId: landlord?.id,
    subscription: landlord?.subscription,
    billingCycle: landlord?.billingCycle, // ✅ NEW
    maxProperties: landlord?.maxProperties,
    maxUnits: landlord?.maxUnits,
  });

  return { landlord, isLoading };
}