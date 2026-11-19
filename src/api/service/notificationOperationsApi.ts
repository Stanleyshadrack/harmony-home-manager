import { apiRequest } from "@/api/https";

export type NotificationRecipient = {
  id: number;
  name: string;
  email: string;
  unit: string;
  property: string;
};

export type DeliveryHistory = {
  id: number;
  timestamp: string;
  type: string | null;
  channel: string | null;
  recipient: string;
  title: string | null;
  message: string;
  status: "accepted" | "failed" | "skipped" | "in_app" | "recorded";
};

export type DeliveryResult = {
  accepted: number;
  failed: number;
  failedTenantIds: number[];
  status: "SUCCESS" | "FAILED" | "PARTIAL_SUCCESS";
};

export const notificationOperationsApi = {
  recipients: () =>
    apiRequest<null, NotificationRecipient[]>({
      path: "/api/notification-operations/recipients",
      method: "GET",
    }),
  history: () =>
    apiRequest<null, DeliveryHistory[]>({
      path: "/api/notification-operations/history",
      method: "GET",
    }),
  send: (tenantIds: number[], title: string, message: string, channel: "EMAIL" | "IN_APP" = "EMAIL") =>
    apiRequest<{tenantIds: number[]; channel: string; title: string; message: string}, DeliveryResult>({
      path: "/api/notification-operations/send",
      method: "POST",
      body: { tenantIds, channel, title, message },
      timeout: 90000,
    }),
};
