import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/api/https';

export interface SystemMaintenanceStatus {
  enabled: boolean;
  message: string;
  enabledAt: string | null;
  updatedAt: string | null;
}

const DEFAULT_STATUS: SystemMaintenanceStatus = {
  enabled: false, message: '', enabledAt: null, updatedAt: null,
};
const POLL_MS = 10000;
const EVENT = 'apartment:maintenance-status';

export function announceMaintenanceChange() {
  window.dispatchEvent(new Event(EVENT));
}

export function useSystemMaintenance(userId?: string) {
  const [status, setStatus] = useState<SystemMaintenanceStatus>(DEFAULT_STATUS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      const next = await apiRequest<null, SystemMaintenanceStatus>({
        path: userId ? '/api/system-maintenance/me' : '/api/system-maintenance/status', method: 'GET', retry: false,
      });
      setStatus(next);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'System maintenance status unavailable');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), POLL_MS);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    window.addEventListener(EVENT, onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener(EVENT, onFocus);
    };
  }, [refresh]);

  return { status, loading, error, refresh };
}
