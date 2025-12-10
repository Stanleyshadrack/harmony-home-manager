// Notification Service - Frontend implementation ready for Twilio backend integration
// When backend is enabled, these will call edge functions instead of mock implementations

export type NotificationType = 'rent_reminder' | 'payment_confirmation' | 'maintenance_update' | 'lease_expiry' | 'general';
export type NotificationChannel = 'sms' | 'whatsapp' | 'email';

export interface NotificationPayload {
  recipientPhone: string;
  recipientName: string;
  type: NotificationType;
  channel: NotificationChannel;
  data: Record<string, string | number>;
}

export interface NotificationLog {
  id: string;
  timestamp: Date;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
}

// Notification templates
const templates: Record<NotificationType, (data: Record<string, string | number>) => string> = {
  rent_reminder: (data) => 
    `Hi ${data.tenantName}, this is a reminder that your rent of KES ${data.amount} for ${data.unit} is due on ${data.dueDate}. Please make payment to avoid late fees.`,
  
  payment_confirmation: (data) => 
    `Hi ${data.tenantName}, we've received your payment of KES ${data.amount} for ${data.unit}. Receipt #${data.receiptNumber}. Thank you!`,
  
  maintenance_update: (data) => 
    `Hi ${data.tenantName}, your maintenance request #${data.requestId} (${data.title}) has been updated to: ${data.status}. ${data.notes || ''}`,
  
  lease_expiry: (data) => 
    `Hi ${data.tenantName}, your lease for ${data.unit} expires on ${data.expiryDate}. Please contact management to discuss renewal options.`,
  
  general: (data) => 
    `Hi ${data.tenantName}, ${data.message}`,
};

// Get notification logs from localStorage
export const getNotificationLogs = (): NotificationLog[] => {
  const logs = localStorage.getItem('notification_logs');
  return logs ? JSON.parse(logs) : [];
};

// Save notification log
const saveNotificationLog = (log: NotificationLog): void => {
  const logs = getNotificationLogs();
  logs.unshift(log);
  // Keep only last 100 logs
  localStorage.setItem('notification_logs', JSON.stringify(logs.slice(0, 100)));
};

// Mock send notification (will be replaced with Twilio edge function call)
export const sendNotification = async (payload: NotificationPayload): Promise<NotificationLog> => {
  const message = templates[payload.type](payload.data);
  
  const log: NotificationLog = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    type: payload.type,
    channel: payload.channel,
    recipient: payload.recipientPhone,
    message,
    status: 'pending',
  };

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock success (90% success rate for demo)
  if (Math.random() > 0.1) {
    log.status = 'sent';
    console.log(`[${payload.channel.toUpperCase()}] Sent to ${payload.recipientPhone}: ${message}`);
  } else {
    log.status = 'failed';
    log.error = 'Network timeout';
  }

  saveNotificationLog(log);
  return log;
};

// Bulk send notifications
export const sendBulkNotifications = async (payloads: NotificationPayload[]): Promise<NotificationLog[]> => {
  return Promise.all(payloads.map(sendNotification));
};

// Send rent reminders to all tenants with upcoming due dates
export const sendRentReminders = async (tenants: Array<{
  name: string;
  phone: string;
  unit: string;
  rentAmount: number;
  dueDate: string;
}>): Promise<NotificationLog[]> => {
  const payloads: NotificationPayload[] = tenants.map(tenant => ({
    recipientPhone: tenant.phone,
    recipientName: tenant.name,
    type: 'rent_reminder',
    channel: 'sms',
    data: {
      tenantName: tenant.name,
      amount: tenant.rentAmount,
      unit: tenant.unit,
      dueDate: tenant.dueDate,
    },
  }));

  return sendBulkNotifications(payloads);
};

// Clear all notification logs
export const clearNotificationLogs = (): void => {
  localStorage.removeItem('notification_logs');
};
