import { API_PATHS } from "../constants/constants";
import { apiRequest } from "../https";

export type InviteUserPayload = {
  email: string;
  role: "LANDLORD" | "TENANT" | "EMPLOYEE";
  apartmentIds: number[];
  companyId?: number | null;
  unitId?: number | null;
};

export type InvitePropertyOption = {
  id: number;
  name: string;
  companyId: number;
  companyName: string;
};

export type InviteUnitOption = {
  id: number;
  propertyId: number;
  unitNumber: string;
};

export type InviteOptions = {
  properties: InvitePropertyOption[];
  units: InviteUnitOption[];
  companies: { id: number; name: string }[];
};

export type InviteSummary = {
  id: number;
  email: string;
  role: InviteUserPayload["role"];
  expiresAt: string | null;
  status: "PENDING" | "EXPIRED" | "REVOKED";
};

type ApiSuccess = { status: number; message: string; timestamp: string };

export const inviteUserService = (payload: InviteUserPayload) =>
  apiRequest<InviteUserPayload, ApiSuccess>({
    path: API_PATHS.AUTH_INVITE,
    method: "POST",
    body: payload,
  });

export const invitationApi = {
  options: () => apiRequest<null, InviteOptions>({
    path: "/api/auth/invite/options", method: "GET",
  }),
  list: () => apiRequest<null, InviteSummary[]>({
    path: "/api/auth/invitations", method: "GET",
  }),
  resend: (id: number) => apiRequest<null, ApiSuccess>({
    path: `/api/auth/invitations/${id}/resend`, method: "POST",
  }),
  revoke: (id: number) => apiRequest<null, ApiSuccess>({
    path: `/api/auth/invitations/${id}`, method: "DELETE",
  }),
};
