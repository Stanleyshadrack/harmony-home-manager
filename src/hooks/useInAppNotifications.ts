import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotificationHistory, markNotificationAsRead } from '@/api/service/notificationService';
import { apiRequest } from '@/api/https';


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
  id: number; // 🔥 Changed to number to match backend Long ID
  userId?: string | number;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  read: boolean;
  createdAt: string;
  link?: string;
  type?: string;
  channel?: string;
}

export function useInAppNotifications(userId?: string | number) {
  const queryClient = useQueryClient();

  // 1. Fetch from Spring Boot Backend
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['in-app-notifications', userId],
    queryFn: async () => {
      const data = await getNotificationHistory();
      
      // Map the backend data to match your frontend's exact interface
      return data.map((n: any) => ({
        ...n,
        // Map backend 'type' to frontend 'category'
        category: (n.type?.toLowerCase() || 'general') as NotificationCategory,
        priority: 'medium' as NotificationPriority, // Default priority
      })) as InAppNotification[];
    },
    enabled: !!userId, // Only fetch if user is logged in
    refetchInterval: 30000, // 🔥 Auto-poll every 30 seconds for new messages
  });

  // 2. Mark as Read Mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['in-app-notifications', userId] });
    }
  });

  // 3. Delete Mutation
  // Note: Ensure you add a `@DeleteMapping("/{id}")` endpoint to your Spring Boot NotificationController!
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest({ 
      path: `/api/notifications/${id}`, 
      method: 'DELETE' 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['in-app-notifications', userId] });
    }
  });

  // ============================================
  // EXPORTED UI HELPERS
  // ============================================

  const markAsRead = useCallback((id: string | number) => {
    markAsReadMutation.mutate(Number(id));
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(() => {
    // Loops through all unread notifications and marks them as read
    notifications
      .filter(n => !n.read)
      .forEach(n => markAsReadMutation.mutate(Number(n.id)));
  }, [notifications, markAsReadMutation]);

  const deleteNotification = useCallback((id: string | number) => {
    deleteMutation.mutate(Number(id));
  }, [deleteMutation]);

  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Dummy add function for frontend compatibility if any components still use it locally
  const addNotification = useCallback((data: any) => {
    console.warn("addNotification should now be triggered via the backend bulk-send/send APIs");
    return data;
  }, []);

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