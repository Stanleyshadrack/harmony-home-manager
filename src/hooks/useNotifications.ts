import { useState, useCallback } from 'react';
import { 
  sendNotification, 
  sendRentReminders, 
  getNotificationLogs,
  NotificationPayload,
  NotificationLog,
  NotificationType,
  NotificationChannel
} from '@/services/notificationService';
import { useToast } from '@/hooks/use-toast';

export const useNotifications = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<NotificationLog[]>(() => getNotificationLogs());
  const { toast } = useToast();

  const refreshLogs = useCallback(() => {
    setLogs(getNotificationLogs());
  }, []);

  const send = useCallback(async (payload: NotificationPayload) => {
    setIsLoading(true);
    try {
      const result = await sendNotification(payload);
      refreshLogs();
      
      if (result.status === 'sent') {
        toast({
          title: 'Notification sent',
          description: `${payload.channel.toUpperCase()} sent to ${payload.recipientName}`,
        });
      } else {
        toast({
          title: 'Notification failed',
          description: result.error || 'Unknown error',
          variant: 'destructive',
        });
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [toast, refreshLogs]);

  const sendBulkReminders = useCallback(async (tenants: Array<{
    name: string;
    phone: string;
    unit: string;
    rentAmount: number;
    dueDate: string;
  }>) => {
    setIsLoading(true);
    try {
      const results = await sendRentReminders(tenants);
      refreshLogs();
      
      const successful = results.filter(r => r.status === 'sent').length;
      const failed = results.length - successful;
      
      toast({
        title: 'Rent reminders sent',
        description: `${successful} sent, ${failed} failed`,
        variant: failed > 0 ? 'destructive' : 'default',
      });
      
      return results;
    } finally {
      setIsLoading(false);
    }
  }, [toast, refreshLogs]);

  const sendQuickNotification = useCallback(async (
    phone: string,
    name: string,
    type: NotificationType,
    channel: NotificationChannel,
    data: Record<string, string | number>
  ) => {
    return send({
      recipientPhone: phone,
      recipientName: name,
      type,
      channel,
      data,
    });
  }, [send]);

  return {
    isLoading,
    logs,
    refreshLogs,
    send,
    sendBulkReminders,
    sendQuickNotification,
  };
};
