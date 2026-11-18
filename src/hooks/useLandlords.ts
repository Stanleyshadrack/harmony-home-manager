import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LandlordTypes } from "@/types/LandlordTypes";
import { createLandlord, fetchAllLandlords } from "@/api/service/landlords.service.api";
import { mapLandlordDto } from "@/api/mapper/landlord.mapper";
import {
  suspendSubscription,
  upgradeMySubscription,
  renewSubscriptionAdmin,
} from "@/api/service/subscription.service";

export type SubscriptionPlan = "BASIC" | "PREMIUM" | "ENTERPRISE";
export type Landlord = LandlordTypes;
export type SubscriptionPlanDetails = { id: SubscriptionPlan; name: string; price: number; maxProperties: number; maxUnits: number; features: string[] };
export type LandlordStatus = "active" | "suspended" | "pending";


const subscriptionPlans: SubscriptionPlanDetails[] = [
  {
    id: "BASIC",
    name: "Basic Plan",
    price: 29,
    maxProperties: 3,
    maxUnits: 10,
    features: ["Up to 3 properties", "Up to 10 units", "Basic reports"],
  },
  {
    id: "PREMIUM",
    name: "Premium Plan",
    price: 79,
    maxProperties: 10,
    maxUnits: 50,
    features: ["Up to 10 properties", "Up to 50 units", "Advanced reports"],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise Plan",
    price: 199,
    maxProperties: 999,
    maxUnits: 9999,
    features: ["Unlimited properties", "Unlimited units", "API access"],
  },
];

const mapStatus = (status: string): LandlordStatus => {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "SUSPENDED":
      return "suspended";
    default:
      return "pending";
  }
};

const getDaysUntilExpiration = (date: string) => {
  const today = new Date();
  const end = new Date(date);
  const diff = end.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export function useLandlords() {
  const { user, isLoading: authLoading } = useAuth();
  const [landlords, setLandlords] = useState<LandlordTypes[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // /api/landlords is restricted to SUPER_ADMIN; other roles must not call it.
    if (authLoading) return;
    if (user?.role !== 'super_admin') {
      setLandlords([]);
      setIsLoading(false);
      return;
    }
    let active = true;
    const loadLandlords = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAllLandlords();
        if (active) setLandlords(data.map(mapLandlordDto));
      } catch (error) {
        if (active) {
          setLandlords([]);
          // Keep unexpected errors visible without unhandled promise rejections.
          console.warn("Could not load authorized landlord directory", error);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadLandlords();
    return () => { active = false; };
  }, [authLoading, user?.id, user?.role]);

  const addLandlord = useCallback(
    async (data: { userId: number; companyName: string; phone: string }) => {
      const created = await createLandlord(data);
      const mapped = mapLandlordDto(created);

      setLandlords((prev) => [...prev, mapped]);
      return mapped;
    },
    []
  );

  const updateLandlord = useCallback(
  (id: number, data: Partial<LandlordTypes>) => {
    setLandlords((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, ...data, updatedAt: new Date().toISOString() }
          : l
      )
    );
  },
  []
);

 const deleteLandlord = useCallback((id: number) => {
  setLandlords((prev) => prev.filter((l) => l.id !== id));
}, []);

 const suspendLandlord = useCallback(async (id: number) => {
  await suspendSubscription(id);

  setLandlords((prev) =>
    prev.map((l) =>
      l.id === id ? { ...l, status: "suspended" as LandlordStatus } : l
    )
  );
}, []);

  const activateLandlord = useCallback(
  (id: number) => {
    updateLandlord(id, { status: "active" });
  },
  [updateLandlord]
);

const updateSubscription = useCallback(
  async (
    id: number,
    plan: SubscriptionPlan,
    billingCycle: "MONTHLY" | "ANNUAL"
  ) => {
    const updated = await upgradeMySubscription({
      plan,
      billingCycle,
    });

    setLandlords((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              subscription: updated.plan,
              subscriptionStartDate: updated.startDate,
              subscriptionEndDate: updated.endDate,
              maxProperties: updated.maxProperties,
              maxUnits: updated.maxUnits,
              status: mapStatus(updated.status),
            }
          : l
      )
    );
  },
  []
);


 const renewSubscription = useCallback(async (id: number) => {
  try {
    const updated = await renewSubscriptionAdmin(id);

    setLandlords((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              subscriptionEndDate: updated.endDate,
              subscriptionStartDate: updated.startDate,
              status: mapStatus(updated.status),
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
  } catch (error) {
    console.error("Failed to renew subscription", error);
  }
}, []);

  const isSubscriptionExpired = useCallback((landlord: LandlordTypes) => {
    return new Date(landlord.subscriptionEndDate) < new Date();
  }, []);

  const getExpiredSubscriptions = useCallback(() => {
    return landlords.filter(isSubscriptionExpired);
  }, [landlords, isSubscriptionExpired]);

  const getActiveLandlords = useCallback(() => {
    return landlords.filter((l) => l.status === "active");
  }, [landlords]);

  const getLandlordById = useCallback(
  (id: number) => {
    return landlords.find((l) => l.id === id);
  },
  [landlords]
);

  const getExpiringSubscriptions = useCallback(
    (withinDays: number = 30) => {
      return landlords.filter((l) => {
        const days = getDaysUntilExpiration(l.subscriptionEndDate);
        return days > 0 && days <= withinDays && l.status === "active";
      });
    },
    [landlords]
  );

  return {
    landlords,
    isLoading,
    addLandlord,
    updateLandlord,
    deleteLandlord,
    suspendLandlord,
    subscriptionPlans,
    activateLandlord,
    updateSubscription,
    renewSubscription,
    isSubscriptionExpired,
    getExpiredSubscriptions,
    getActiveLandlords,
    getLandlordById,
    getExpiringSubscriptions,
    getDaysUntilExpiration,
  };
}