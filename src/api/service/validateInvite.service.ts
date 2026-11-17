import { apiRequest } from "../https";
import { API_PATHS } from "../constants/constants";

export type InviteValidationResponse = {
  email: string;
  role: "LANDLORD" | "TENANT" | "EMPLOYEE" | "SUPER_ADMIN";
  valid: boolean;
  companyId?: number | null;
  companyName?: string | null;
  property?: { id: number; name: string } | null;
  unit?: { id: number; unitNumber: string; propertyId: number; propertyName: string } | null;
  apartments?: { id: number; name: string }[] | null;
  rentAmount?: number | null;
  depositAmount?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

export const validateInvite = async (token: string) => {
  return apiRequest<null, InviteValidationResponse>({
    path: `${API_PATHS.AUTH_INVITE_VALIDATE}?token=${encodeURIComponent(token)}`,
    method: "GET",
  });
};
