import { API_PATHS } from "../constants/constants";
import { apiRequest } from "../https";

export type InviteUserPayload = {
  email: string;
  role: "LANDLORD" | "TENANT" | "EMPLOYEE" | "ADMIN";
  apartmentIds: string[];
  unitId: number | null; 
};

export const inviteUserService = async (payload: InviteUserPayload) => {
  return apiRequest<
    InviteUserPayload,
    { status: number; message: string; timestamp: string }
  >({
    path: API_PATHS.AUTH_INVITE,
    method: "POST",
    body: payload,
  });
};
