import { API_PATHS } from "../constants/constants";
import { apiRequest } from "../https";

/* =========================
   TYPES
========================= */

export interface NotificationTemplate {
  id: number;
  name: string;
  category: string;
  messageFormat: string;
}

export interface NotificationLog {
  id: number;
  channel: "sms" | "whatsapp" | "email" | string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  recipient?: string; 
}

export interface BulkSendRequest {
  templateId: number;
  tenantIds: number[];
  channel: string;
  meta?: Record<string, string>;
}

export interface BulkSendResponse {
  sentCount: number;
  failed: string[];
  status: "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED";
}

export interface SingleSendRequest {
  tenantId: number;
  channel: string;
  title: string;
  message: string;
}

/* =========================
   GET TEMPLATES
========================= */
export const getNotificationTemplates = async (): Promise<NotificationTemplate[]> => {
  return apiRequest<null, NotificationTemplate[]>({
    path: API_PATHS.NOTIFICATION_TEMPLATES,
    method: "GET",
  });
};

/* =========================
   GET HISTORY LOGS (Fixed for Tenants)
========================= */
export const getNotificationHistory = async (): Promise<NotificationLog[]> => {
  // 🔥 Hit the base endpoint to trigger the "listMine" method in Spring Boot
  const response = await apiRequest<null, any>({
    path: "/api/notifications/history", // <-- Replaced API_PATHS.NOTIFICATION_HISTORY to fix the 403 error
    method: "GET",
  });

  // 🔥 Spring Boot returns a Page object: { content: [...], pageable: {...} }
  // We extract and return just the array of notifications
  return response.content || response; 
};

/* =========================
   GET PROPERTY NOTIFICATIONS
========================= */
export const getPropertyNotifications = async (propertyId: number): Promise<NotificationLog[]> => {
  return apiRequest<null, NotificationLog[]>({
    path: API_PATHS.NOTIFICATIONS_BY_PROPERTY(propertyId),
    method: "GET",
  });
};

/* =========================
   SEND SINGLE NOTIFICATION
========================= */
export const sendSingleNotification = async (
  payload: SingleSendRequest
): Promise<NotificationLog> => {
  return apiRequest<null, NotificationLog>({
    path: API_PATHS.SEND_NOTIFICATION,
    method: "POST",
    params: {
      tenantId: payload.tenantId,
      channel: payload.channel,
      title: payload.title,
      message: payload.message,
    },
  });
};

/* =========================
   SEND BULK NOTIFICATIONS
========================= */
export const sendBulkNotifications = async (
  payload: BulkSendRequest
): Promise<BulkSendResponse> => {
  return apiRequest<BulkSendRequest, BulkSendResponse>({
    path: API_PATHS.SEND_BULK_NOTIFICATIONS,
    method: "POST",
    body: payload,
  });
};

/* =========================
   MARK AS READ
========================= */
export const markNotificationAsRead = async (id: number): Promise<void> => {
  return apiRequest<null, void>({
    path: API_PATHS.MARK_NOTIFICATION_READ(id),
    method: "PATCH",
  });
};

/* =========================
   DELETE NOTIFICATION
========================= */
export const deleteNotification = async (id: number): Promise<void> => {
  return apiRequest<null, void>({
    path: `/api/notifications/${id}`,
    method: "DELETE",
  });
};