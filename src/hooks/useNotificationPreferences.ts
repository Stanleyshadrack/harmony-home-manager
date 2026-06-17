import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Updated to match the backend categories (billing, maintenance, lease, general)
export interface NotificationPreferences {
  inApp: {
    enabled: boolean;
    billing: boolean;
    maintenance: boolean;
    lease: boolean;
    general: boolean;
  };
  email: {
    enabled: boolean;
    billing: boolean;
    maintenance: boolean;
    lease: boolean;
    general: boolean;
  };
  sms: {
    enabled: boolean;
    billing: boolean;
    maintenance: boolean;
    lease: boolean;
    general: boolean;
  };
}

const defaultPreferences: NotificationPreferences = {
  inApp: {
    enabled: true,
    billing: true,
    maintenance: true,
    lease: true,
    general: true,
  },
  email: {
    enabled: true,
    billing: true,
    maintenance: true,
    lease: true,
    general: false,
  },
  sms: {
    enabled: false,
    billing: true,
    maintenance: false,
    lease: false,
    general: false,
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
    // Ignore parse errors
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
      setPreferences(getStoredPreferences(user.id.toString()));
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
    savePreferences(user.id.toString(), updated);
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
    savePreferences(user.id.toString(), updated);
  }, [user?.id, preferences]);

  const resetToDefaults = useCallback(() => {
    if (!user?.id) return;
    setPreferences(defaultPreferences);
    savePreferences(user.id.toString(), defaultPreferences);
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