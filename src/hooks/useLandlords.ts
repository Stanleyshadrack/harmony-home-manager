import { useState, useCallback, useEffect } from 'react';
import { sendSubscriptionReminderEmail, sendSubscriptionSuspendedEmail } from '@/services/adminEmailService';

export type SubscriptionPlan = 'basic' | 'premium' | 'enterprise';
export type LandlordStatus = 'active' | 'suspended' | 'pending';

export interface Landlord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  status: LandlordStatus;
  subscription: SubscriptionPlan;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  maxProperties: number;
  maxUnits: number;
  currentProperties: number;
  currentUnits: number;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
  lastReminderSent?: string;
}

export interface SubscriptionPlanDetails {
  id: SubscriptionPlan;
  name: string;
  price: number;
  maxProperties: number;
  maxUnits: number;
  features: string[];
}

const STORAGE_KEY = 'landlords';
const REMINDER_DAYS = [30, 14, 7, 3, 1]; // Days before expiration to send reminders

const subscriptionPlans: SubscriptionPlanDetails[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 29,
    maxProperties: 3,
    maxUnits: 10,
    features: ['Up to 3 properties', 'Up to 10 units', 'Basic reports', 'Email support'],
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 79,
    maxProperties: 10,
    maxUnits: 50,
    features: ['Up to 10 properties', 'Up to 50 units', 'Advanced reports', 'Priority support', 'SMS notifications'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 199,
    maxProperties: 999,
    maxUnits: 9999,
    features: ['Unlimited properties', 'Unlimited units', 'Custom reports', '24/7 support', 'API access', 'White-label options'],
  },
];

const mockLandlords: Landlord[] = [
  {
    id: '1',
    firstName: 'Alice',
    lastName: 'Wanjiku',
    email: 'alice@landlord.com',
    phone: '+254 712 345 678',
    company: 'Wanjiku Properties',
    status: 'active',
    subscription: 'premium',
    subscriptionStartDate: '2023-06-15',
    subscriptionEndDate: '2024-06-15',
    maxProperties: 10,
    maxUnits: 50,
    currentProperties: 5,
    currentUnits: 42,
    createdAt: '2023-06-15',
    updatedAt: '2024-01-10',
  },
  {
    id: '2',
    firstName: 'Bob',
    lastName: 'Ochieng',
    email: 'bob@landlord.com',
    phone: '+254 723 456 789',
    company: 'Ochieng Estates',
    status: 'active',
    subscription: 'basic',
    subscriptionStartDate: '2023-09-20',
    subscriptionEndDate: '2024-09-20',
    maxProperties: 3,
    maxUnits: 10,
    currentProperties: 3,
    currentUnits: 24,
    createdAt: '2023-09-20',
    updatedAt: '2024-01-05',
  },
  {
    id: '3',
    firstName: 'Carol',
    lastName: 'Muthoni',
    email: 'carol@landlord.com',
    phone: '+254 734 567 890',
    company: 'Muthoni Holdings',
    status: 'suspended',
    subscription: 'enterprise',
    subscriptionStartDate: '2023-03-10',
    subscriptionEndDate: '2024-03-10',
    maxProperties: 999,
    maxUnits: 9999,
    currentProperties: 8,
    currentUnits: 96,
    createdAt: '2023-03-10',
    updatedAt: '2024-01-01',
  },
];

const getStoredLandlords = (): Landlord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockLandlords));
  return mockLandlords;
};

const saveLandlords = (landlords: Landlord[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(landlords));
};

// Calculate days until subscription expires
const getDaysUntilExpiration = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export function useLandlords() {
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check subscriptions and send reminders/suspend
  const checkSubscriptions = useCallback(async (currentLandlords: Landlord[]) => {
    let updated = false;
    const updatedLandlords = [...currentLandlords];

    for (let i = 0; i < updatedLandlords.length; i++) {
      const landlord = updatedLandlords[i];
      const daysUntilExpiration = getDaysUntilExpiration(landlord.subscriptionEndDate);
      const planDetails = subscriptionPlans.find(p => p.id === landlord.subscription);

      // Check if subscription is expired
      if (daysUntilExpiration < 0 && landlord.status === 'active') {
        // Auto-suspend expired subscription
        updatedLandlords[i] = {
          ...landlord,
          status: 'suspended',
          updatedAt: new Date().toISOString(),
        };
        updated = true;

        // Send suspension email
        await sendSubscriptionSuspendedEmail({
          landlordName: `${landlord.firstName} ${landlord.lastName}`,
          landlordEmail: landlord.email,
          planName: planDetails?.name || landlord.subscription,
          suspensionDate: new Date().toISOString(),
        });

        console.log(`🔒 Auto-suspended landlord ${landlord.email} due to expired subscription`);
        continue;
      }

      // Check if we need to send a reminder
      if (landlord.status === 'active' && daysUntilExpiration > 0) {
        const shouldSendReminder = REMINDER_DAYS.includes(daysUntilExpiration);
        const lastReminder = landlord.lastReminderSent ? new Date(landlord.lastReminderSent) : null;
        const today = new Date().toDateString();

        if (shouldSendReminder && (!lastReminder || lastReminder.toDateString() !== today)) {
          // Send reminder email
          await sendSubscriptionReminderEmail({
            landlordName: `${landlord.firstName} ${landlord.lastName}`,
            landlordEmail: landlord.email,
            planName: planDetails?.name || landlord.subscription,
            expirationDate: landlord.subscriptionEndDate,
            daysUntilExpiration,
          });

          updatedLandlords[i] = {
            ...landlord,
            lastReminderSent: new Date().toISOString(),
          };
          updated = true;

          console.log(`📧 Sent subscription reminder to ${landlord.email} - ${daysUntilExpiration} days left`);
        }
      }
    }

    if (updated) {
      saveLandlords(updatedLandlords);
      setLandlords(updatedLandlords);
    }
  }, []);

  useEffect(() => {
    const storedLandlords = getStoredLandlords();
    setLandlords(storedLandlords);
    setIsLoading(false);

    // Check subscriptions on load
    checkSubscriptions(storedLandlords);

    // Set up periodic check (every hour in production, every 30 seconds for demo)
    const interval = setInterval(() => {
      const current = getStoredLandlords();
      checkSubscriptions(current);
    }, 30000); // 30 seconds for demo

    return () => clearInterval(interval);
  }, [checkSubscriptions]);

  const addLandlord = useCallback((data: Omit<Landlord, 'id' | 'createdAt' | 'updatedAt' | 'currentProperties' | 'currentUnits'>) => {
    const plan = subscriptionPlans.find(p => p.id === data.subscription) || subscriptionPlans[0];
    const newLandlord: Landlord = {
      ...data,
      id: `landlord-${Date.now()}`,
      maxProperties: plan.maxProperties,
      maxUnits: plan.maxUnits,
      currentProperties: 0,
      currentUnits: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...landlords, newLandlord];
    setLandlords(updated);
    saveLandlords(updated);
    return newLandlord;
  }, [landlords]);

  const updateLandlord = useCallback((id: string, data: Partial<Landlord>) => {
    const updated = landlords.map(l => {
      if (l.id === id) {
        const updatedLandlord = { ...l, ...data, updatedAt: new Date().toISOString() };
        // If subscription changed, update limits
        if (data.subscription && data.subscription !== l.subscription) {
          const plan = subscriptionPlans.find(p => p.id === data.subscription);
          if (plan) {
            updatedLandlord.maxProperties = plan.maxProperties;
            updatedLandlord.maxUnits = plan.maxUnits;
          }
        }
        return updatedLandlord;
      }
      return l;
    });
    setLandlords(updated);
    saveLandlords(updated);
  }, [landlords]);

  const deleteLandlord = useCallback((id: string) => {
    const updated = landlords.filter(l => l.id !== id);
    setLandlords(updated);
    saveLandlords(updated);
  }, [landlords]);

  const suspendLandlord = useCallback(async (id: string) => {
    const landlord = landlords.find(l => l.id === id);
    if (landlord) {
      const planDetails = subscriptionPlans.find(p => p.id === landlord.subscription);
      await sendSubscriptionSuspendedEmail({
        landlordName: `${landlord.firstName} ${landlord.lastName}`,
        landlordEmail: landlord.email,
        planName: planDetails?.name || landlord.subscription,
        suspensionDate: new Date().toISOString(),
      });
    }
    updateLandlord(id, { status: 'suspended' });
  }, [landlords, updateLandlord]);

  const activateLandlord = useCallback((id: string) => {
    updateLandlord(id, { status: 'active' });
  }, [updateLandlord]);

  const updateSubscription = useCallback((id: string, plan: SubscriptionPlan) => {
    const planDetails = subscriptionPlans.find(p => p.id === plan);
    if (!planDetails) return;
    
    const startDate = new Date().toISOString();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    updateLandlord(id, {
      subscription: plan,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate.toISOString(),
      maxProperties: planDetails.maxProperties,
      maxUnits: planDetails.maxUnits,
      status: 'active', // Reactivate if was suspended
    });
  }, [updateLandlord]);

  const isSubscriptionExpired = useCallback((landlord: Landlord): boolean => {
    return new Date(landlord.subscriptionEndDate) < new Date();
  }, []);

  const getExpiredSubscriptions = useCallback((): Landlord[] => {
    return landlords.filter(isSubscriptionExpired);
  }, [landlords, isSubscriptionExpired]);

  const getActiveLandlords = useCallback((): Landlord[] => {
    return landlords.filter(l => l.status === 'active');
  }, [landlords]);

  const getLandlordById = useCallback((id: string): Landlord | undefined => {
    return landlords.find(l => l.id === id);
  }, [landlords]);

  const getExpiringSubscriptions = useCallback((withinDays: number = 30): Landlord[] => {
    return landlords.filter(l => {
      const days = getDaysUntilExpiration(l.subscriptionEndDate);
      return days > 0 && days <= withinDays && l.status === 'active';
    });
  }, [landlords]);

  const renewSubscription = useCallback((id: string) => {
    const landlord = landlords.find(l => l.id === id);
    if (!landlord) return;

    const newEndDate = new Date(landlord.subscriptionEndDate);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);

    updateLandlord(id, {
      subscriptionEndDate: newEndDate.toISOString(),
      status: 'active',
    });
  }, [landlords, updateLandlord]);

  return {
    landlords,
    isLoading,
    subscriptionPlans,
    addLandlord,
    updateLandlord,
    deleteLandlord,
    suspendLandlord,
    activateLandlord,
    updateSubscription,
    isSubscriptionExpired,
    getExpiredSubscriptions,
    getActiveLandlords,
    getLandlordById,
    getExpiringSubscriptions,
    renewSubscription,
    getDaysUntilExpiration,
  };
}
