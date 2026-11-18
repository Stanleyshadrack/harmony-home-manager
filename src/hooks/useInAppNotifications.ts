import { useState, useCallback, useEffect } from 'react';
import { apiRequest } from '@/api/https';

export type NotificationPriority = 'low' | 'medium' | 'high';
export type NotificationCategory =
  | 'registration_approved' | 'registration_rejected' | 'payment_received'
  | 'maintenance_update' | 'rent_reminder' | 'lease_expiry'
  | 'task_assigned' | 'water_reading_pending' | 'water_reading_approved'
  | 'water_reading_rejected' | 'new_message' | 'general';

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  read: boolean;
  createdAt: string;
  link?: string;
}

type ServerNotification = {
  id: number; title: string; message: string; category: NotificationCategory;
  read: boolean; createdAt: string;
};

const REFRESH_MS = 15000;

export function useInAppNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) { setNotifications([]); setIsLoading(false); return; }
    try {
      const data = await apiRequest<null, ServerNotification[]>({
        path: '/api/notifications/in-app', method: 'GET',
      });
      setNotifications(data.map(item => ({
        ...item, id: String(item.id), userId, priority: 'medium' as const,
      })));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) { setNotifications([]); setIsLoading(false); return; }
    setIsLoading(true);
    void refresh();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, REFRESH_MS);
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, [userId, refresh]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiRequest<null, null>({path: `/api/notifications/${encodeURIComponent(id)}/read`, method: 'PATCH'});
      setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to mark notification read');
      throw e;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiRequest<null, null>({path: '/api/notifications/read-all', method: 'PATCH'});
      setNotifications(prev => prev.map(n => ({...n, read: true})));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to mark all notifications read');
      throw e;
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await apiRequest<null, null>({path: `/api/notifications/${encodeURIComponent(id)}`, method: 'DELETE'});
      setNotifications(prev => prev.filter(n => n.id !== id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete notification');
      throw e;
    }
  }, []);

  const getUnreadCount = useCallback(() => notifications.filter(n => !n.read).length, [notifications]);

  return {
    notifications, isLoading, error, refresh,
    markAsRead, markAllAsRead, deleteNotification, getUnreadCount,
  };
}
