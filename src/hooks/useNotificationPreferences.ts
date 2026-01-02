import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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

  useEffect(() => {
    if (user?.id) {
      setPreferences(getStoredPreferences(user.id));
    }
    setIsLoading(false);
  }, [user?.id]);

  const updatePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
    if (!user?.id) return;
    
    const updated = {
      ...preferences,
      ...newPrefs,
    };
    setPreferences(updated);
    savePreferences(user.id, updated);
  }, [user?.id, preferences]);

  const updateChannelPreference = useCallback((
    channel: 'inApp' | 'email' | 'sms',
    key: keyof NotificationPreferences['inApp'],
    value: boolean
  ) => {
    if (!user?.id) return;
    
    const updated = {
      ...preferences,
      [channel]: {
        ...preferences[channel],
        [key]: value,
      },
    };
    setPreferences(updated);
    savePreferences(user.id, updated);
  }, [user?.id, preferences]);

  const resetToDefaults = useCallback(() => {
    if (!user?.id) return;
    setPreferences(defaultPreferences);
    savePreferences(user.id, defaultPreferences);
  }, [user?.id]);

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
