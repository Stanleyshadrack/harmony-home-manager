import { useState, useEffect, useCallback } from "react";

import { SubscriptionPayment } from "@/types/subscription";
import { SubscriptionResponse } from "@/api/dto/SubscriptionResponse";
import { fetchMySubscription, renewMySubscription, upgradeMySubscription } from "@/api/service/subscription.service";

/* ======================================================
   MAPPERS
====================================================== */

function mapSubscriptionToPayment(
  sub: SubscriptionResponse,
  action: "UPGRADE" | "RENEW"
): SubscriptionPayment {
  return {
    id: `sub-${sub.id}-${Date.now()}`,
    landlordId: String(sub.landlordId),
    landlordName: "Current Landlord", // backend can expose later
    landlordEmail: "—",
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

export function useSubscriptionPayments() {
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [subscription, setSubscription] =
    useState<SubscriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ================= FETCH CURRENT SUBSCRIPTION ================= */

  useEffect(() => {
    let mounted = true;

    fetchMySubscription()
      .then((sub) => {
        if (!mounted) return;

        setSubscription(sub);

        // Initial “payment record” (current subscription state)
        setPayments([
          mapSubscriptionToPayment(sub, "RENEW"),
        ]);
      })
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

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

    setPayments((prev) => [
      mapSubscriptionToPayment(updated, "UPGRADE"),
      ...prev,
    ]);

    return updated;
  },
  []
);

  /* ================= RENEW ================= */

  const renew = useCallback(async () => {
    const updated = await renewMySubscription();

    setSubscription(updated);
    setPayments((prev) => [
      mapSubscriptionToPayment(updated, "RENEW"),
      ...prev,
    ]);

    return updated;
  }, []);

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