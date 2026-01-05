import { useState, useCallback, useEffect } from 'react';
import { SubscriptionPayment } from '@/types/subscription';

const STORAGE_KEY = 'subscription_payments';

const mockPayments: SubscriptionPayment[] = [
  {
    id: 'sp-1',
    landlordId: '1',
    landlordName: 'Alice Wanjiku',
    landlordEmail: 'alice@landlord.com',
    planId: 'premium',
    planName: 'Premium Plan',
    amount: 948,
    paymentMethod: 'card',
    transactionRef: 'TXN-1704067200000',
    cardLast4: '4242',
    status: 'completed',
    renewalPeriod: '1 Year',
    previousExpiryDate: '2023-06-15',
    newExpiryDate: '2024-06-15',
    paymentDate: '2023-06-15T10:30:00Z',
    createdAt: '2023-06-15T10:30:00Z',
  },
  {
    id: 'sp-2',
    landlordId: '2',
    landlordName: 'Bob Ochieng',
    landlordEmail: 'bob@landlord.com',
    planId: 'basic',
    planName: 'Basic Plan',
    amount: 348,
    paymentMethod: 'mpesa',
    transactionRef: 'TXN-1695206400000',
    status: 'completed',
    renewalPeriod: '1 Year',
    previousExpiryDate: '2022-09-20',
    newExpiryDate: '2023-09-20',
    paymentDate: '2022-09-20T14:00:00Z',
    createdAt: '2022-09-20T14:00:00Z',
  },
];

const getStoredPayments = (): SubscriptionPayment[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockPayments));
  return mockPayments;
};

const savePayments = (payments: SubscriptionPayment[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
};

export function useSubscriptionPayments(landlordId?: string) {
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedPayments = getStoredPayments();
    if (landlordId) {
      setPayments(storedPayments.filter(p => p.landlordId === landlordId));
    } else {
      setPayments(storedPayments);
    }
    setIsLoading(false);
  }, [landlordId]);

  const addPayment = useCallback((paymentData: Omit<SubscriptionPayment, 'id' | 'createdAt'>) => {
    const newPayment: SubscriptionPayment = {
      ...paymentData,
      id: `sp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const allPayments = getStoredPayments();
    const updated = [newPayment, ...allPayments];
    savePayments(updated);

    if (landlordId) {
      setPayments(updated.filter(p => p.landlordId === landlordId));
    } else {
      setPayments(updated);
    }

    return newPayment;
  }, [landlordId]);

  const getPaymentsByLandlord = useCallback((id: string): SubscriptionPayment[] => {
    return getStoredPayments().filter(p => p.landlordId === id);
  }, []);

  const getPaymentById = useCallback((id: string): SubscriptionPayment | undefined => {
    return getStoredPayments().find(p => p.id === id);
  }, []);

  const getTotalRevenue = useCallback((): number => {
    return getStoredPayments()
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  }, []);

  return {
    payments,
    isLoading,
    addPayment,
    getPaymentsByLandlord,
    getPaymentById,
    getTotalRevenue,
  };
}
