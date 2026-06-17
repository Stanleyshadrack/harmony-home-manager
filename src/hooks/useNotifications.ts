import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  getNotificationHistory, 
  getNotificationTemplates, 
  sendSingleNotification, 
  sendBulkNotifications 
} from '@/api/service/notificationService'; // 👈 Import the new service

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: logs = [], isLoading: loadingLogs, refetch: refreshLogs } = useQuery({
    queryKey: ['notification-history'],
    queryFn: getNotificationHistory,
  });

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: getNotificationTemplates,
  });

  const sendSingleMutation = useMutation({
    mutationFn: sendSingleNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
    },
    // ... error handling
  });

  const sendBulkMutation = useMutation({
    mutationFn: sendBulkNotifications,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
      // ... success toast
    },
    // ... error handling
  });

  return {
    logs,
    templates,
    isLoading: loadingLogs || loadingTemplates || sendSingleMutation.isPending || sendBulkMutation.isPending,
    refreshLogs,
    sendSingle: sendSingleMutation.mutateAsync,
    sendBulk: sendBulkMutation.mutateAsync,
  };
};