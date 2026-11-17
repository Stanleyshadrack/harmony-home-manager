import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/api/https';

export interface NotificationPreferences {
  inApp: {
    enabled: boolean;
    waterReadings: boolean;
    payments: boolean;
    maintenance: boolean;
    messages: boolean;
    tenantApplications: boolean;
  };
  email: {
    enabled: boolean;
    waterReadings: boolean;
    payments: boolean;
    maintenance: boolean;
    messages: boolean;
    tenantApplications: boolean;
  };
  sms: {
    enabled: boolean;
    waterReadings: boolean;
    payments: boolean;
    maintenance: boolean;
    messages: boolean;
    tenantApplications: boolean;
  };
}

const defaultPreferences: NotificationPreferences = {
  inApp: {
    enabled: true,
    waterReadings: true,
    payments: true,
    maintenance: true,
    messages: true,
    tenantApplications: true,
  },
  email: {
    enabled: true,
    waterReadings: true,
    payments: true,
    maintenance: true,
    messages: false,
    tenantApplications: true,
  },
  sms: {
    enabled: false,
    waterReadings: false,
    payments: true,
    maintenance: true,
    messages: false,
    tenantApplications: false,
  },
};

const STORAGE_KEY = 'notification_preferences';

const getStoredPreferences = (userId: string): NotificationPreferences => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }
  return defaultPreferences;
};

const savePreferences = (userId: string, preferences: NotificationPreferences) => {
  localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(preferences));
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    if (!user?.id) { setIsLoading(false); return; }
    apiRequest<null, NotificationPreferences>({path:'/api/account-support/notification-preferences',method:'GET'})
      .then(data=>{if(active)setPreferences(data);})
      .catch(error=>{if(active)setError(error instanceof Error ? error.message : 'Unable to load saved preferences');})
      .finally(()=>{if(active)setIsLoading(false);});
    return ()=>{active=false;};
  }, [user?.id]);

  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    if (!user?.id) throw new Error('Not authenticated');
    const next = {...preferences,...newPrefs};
    const saved = await apiRequest<NotificationPreferences,NotificationPreferences>({
      path:'/api/account-support/notification-preferences',method:'PUT',body:next,
    });
    setPreferences(saved);
  }, [user?.id,preferences]);

  const updateChannelPreference = useCallback(async (
    channel: 'inApp'|'email'|'sms',
    key: keyof NotificationPreferences['inApp'],
    value: boolean,
  ) => {
    if (!user?.id) throw new Error('Not authenticated');
    const next = {...preferences,[channel]:{...preferences[channel],[key]:value}};
    const saved = await apiRequest<NotificationPreferences,NotificationPreferences>({
      path:'/api/account-support/notification-preferences',method:'PUT',body:next,
    });
    setPreferences(saved);
  },[preferences,user?.id]);

  const resetToDefaults = useCallback(async () => {
    if (!user?.id) throw new Error('Not authenticated');
    const saved = await apiRequest<NotificationPreferences,NotificationPreferences>({
      path:'/api/account-support/notification-preferences',method:'PUT',body:defaultPreferences,
    });
    setPreferences(saved);
  },[user?.id]);

  const shouldNotify = useCallback((
    channel: 'inApp' | 'email' | 'sms',
    category: keyof Omit<NotificationPreferences['inApp'], 'enabled'>
  ): boolean => {
    const channelPrefs = preferences[channel];
    return channelPrefs.enabled && channelPrefs[category];
  }, [preferences]);

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    updateChannelPreference,
    resetToDefaults,
    shouldNotify,
  };
}

// Helper function for use outside React components
export function shouldSendNotification(
  userId: string,
  channel: 'inApp' | 'email' | 'sms',
  category: keyof Omit<NotificationPreferences['inApp'], 'enabled'>
): boolean {
  const prefs = getStoredPreferences(userId);
  return prefs[channel].enabled && prefs[channel][category];
}
