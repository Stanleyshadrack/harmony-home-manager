import { useState, useEffect, useCallback } from 'react';
import { SubscriptionPayment } from '@/types/subscription';
import { SubscriptionResponse } from '@/api/dto/SubscriptionResponse';
import { fetchMySubscription } from '@/api/service/subscription.service';
import { useAuth } from '@/contexts/AuthContext';

/** Subscription payment history must be sourced from verified provider records.
 * This hook deliberately does not fabricate receipt numbers, amounts, or completed transactions.
 */
export function useSubscriptionPayments() {
  const { user } = useAuth();
  const [payments] = useState<SubscriptionPayment[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'landlord') {
      setSubscription(null);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    fetchMySubscription()
      .then(sub => { if (active) {setSubscription(sub); setError(null);} })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Unable to load subscription'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => {active = false;};
  }, [user?.id, user?.role]);

  const upgrade = useCallback(async (_plan: 'BASIC' | 'PREMIUM' | 'ENTERPRISE', _billingCycle: 'MONTHLY' | 'ANNUAL') => {
    throw new Error('Subscription upgrade requires verified payment; no plan change has been made.');
  }, []);

  const renew = useCallback(async () => {
    throw new Error('Subscription renewal requires verified payment; no renewal has been made.');
  }, []);

  const getTotalRevenue = useCallback(() => 0, []);

  return { subscription, payments, isLoading, error, upgrade, renew, getTotalRevenue };
}
