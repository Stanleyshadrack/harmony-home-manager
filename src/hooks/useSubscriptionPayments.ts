import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext"; // 🔥 NEW IMPORT
import { SubscriptionPayment } from "@/types/subscription";
import { SubscriptionResponse } from "@/api/dto/SubscriptionResponse";
import { fetchMySubscription, fetchSubscriptionByLandlord, renewMySubscription, renewSubscriptionAdmin, upgradeMySubscription } from "@/api/service/subscription.service";

/* ======================================================
   MAPPERS
====================================================== */
function mapSubscriptionToPayment(
  sub: SubscriptionResponse,
  action: "UPGRADE" | "RENEW"
): SubscriptionPayment {
  return {
    id: `sub-${sub.id}-${Date.now()}`,
    companyId: String(sub.companyId || 'current'), 
    companyName: sub.companyName || "Current Company", 
    companyEmail: "—",
    planId: sub.plan,
    planName: `${sub.plan} Plan`,
    amount: sub.plan === "PREMIUM" ? 948 : sub.plan === "ENTERPRISE" ? 2399 : 0,
    paymentMethod: "mpesa",
    transactionRef: `SUB-${Date.now()}`,
    status: "completed",
    renewalPeriod: "1 Year",
    previousExpiryDate: sub.startDate,
    newExpiryDate: sub.endDate,
    paymentDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

/* ======================================================
   HOOK
====================================================== */
export function useSubscriptionPayments(targetId?: number, onUpdate?: () => void) {
  const { user } = useAuth(); // 🔥 Get the current user
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ================= FETCH CURRENT SUBSCRIPTION ================= */
  useEffect(() => {
    let mounted = true;

    // 🔥 FAILSAFE: If it's a super admin but no company ID is provided, abort to prevent 500 error
    if (user?.role === "super_admin" && !targetId) {
        setIsLoading(false);
        return;
    }

    // Route request based on whether we have a targetId
    const fetchPromise = targetId 
      ? fetchSubscriptionByLandlord(targetId) 
      : fetchMySubscription();

    fetchPromise
      .then((sub) => {
        if (!mounted) return;
        setSubscription(sub);
        setPayments([mapSubscriptionToPayment(sub, "RENEW")]);
      })
      .catch((error) => {
        console.error("Failed to fetch subscription:", error);
      })
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, [targetId, user?.role]); // added user.role to dependency array

  /* ================= UPGRADE ================= */
  const upgrade = useCallback(
    async (
      plan: "BASIC" | "PREMIUM" | "ENTERPRISE",
      billingCycle: "MONTHLY" | "ANNUAL"
    ) => {
      const updated = await upgradeMySubscription({
        plan,
        billingCycle,
      });

      setSubscription(updated);
      onUpdate?.();
      setPayments((prev) => [
        mapSubscriptionToPayment(updated, "UPGRADE"),
        ...prev,
      ]);

      return updated;
    },
    [onUpdate] 
  );

  /* ================= RENEW ================= */
  const renew = useCallback(async () => {
    // Route request
    const updated = targetId 
      ? await renewSubscriptionAdmin(targetId)
      : await renewMySubscription();

    setSubscription(updated);
    onUpdate?.();
    setPayments((prev) => [mapSubscriptionToPayment(updated, "RENEW"), ...prev]);

    return updated;
  }, [targetId, onUpdate]);

  /* ================= STATS ================= */
  const getTotalRevenue = useCallback(() => {
    return payments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  return {
    subscription,
    payments,
    isLoading,
    upgrade,
    renew,
    getTotalRevenue,
  };
}