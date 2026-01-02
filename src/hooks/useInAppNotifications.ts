import { useState, useCallback, useEffect } from 'react';

export type NotificationPriority = 'low' | 'medium' | 'high';
export type NotificationCategory = 
  | 'registration_approved' 
  | 'registration_rejected' 
  | 'payment_received' 
  | 'maintenance_update' 
  | 'rent_reminder' 
  | 'lease_expiry' 
  | 'task_assigned'
  | 'water_reading_pending'
  | 'water_reading_approved'
  | 'water_reading_rejected'
  | 'new_message'
  | 'general';

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

const STORAGE_KEY = 'in_app_notifications';

const getStoredNotifications = (): InAppNotification[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveNotifications = (notifications: InAppNotification[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
};

export function useInAppNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const allNotifications = getStoredNotifications();
    const userNotifications = userId 
      ? allNotifications.filter(n => n.userId === userId || n.userId === 'all')
      : allNotifications;
    setNotifications(userNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
    setIsLoading(false);
  }, [userId]);

  const addNotification = useCallback((
    data: Omit<InAppNotification, 'id' | 'read' | 'createdAt'>
  ) => {
    const newNotification: InAppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const allNotifications = getStoredNotifications();
    const updated = [newNotification, ...allNotifications].slice(0, 100);
    saveNotifications(updated);
    
    if (!userId || newNotification.userId === userId || newNotification.userId === 'all') {
      setNotifications(prev => [newNotification, ...prev].slice(0, 100));
    }

    return newNotification;
  }, [userId]);

  const markAsRead = useCallback((id: string) => {
    const allNotifications = getStoredNotifications();
    const updated = allNotifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  }, []);

  const markAllAsRead = useCallback(() => {
    const allNotifications = getStoredNotifications();
    const updated = allNotifications.map(n => 
      (!userId || n.userId === userId || n.userId === 'all') 
        ? { ...n, read: true } 
        : n
    );
    saveNotifications(updated);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [userId]);

  const deleteNotification = useCallback((id: string) => {
    const allNotifications = getStoredNotifications();
    const updated = allNotifications.filter(n => n.id !== id);
    saveNotifications(updated);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  return {
    notifications,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
  };
}
