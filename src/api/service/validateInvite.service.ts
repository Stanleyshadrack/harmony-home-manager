import { apiRequest } from "../https";
import { API_PATHS } from "../constants/constants";

export type InviteValidationResponse = {
  email: string;
  role: "LANDLORD" | "TENANT" | "EMPLOYEE" | "ADMIN";
  expiresAt: string;
};

export const validateInvite = async (token: string) => {
  return apiRequest<null, InviteValidationResponse>({
    path: `${API_PATHS.AUTH_INVITE_VALIDATE}?token=${token}`,
    method: "GET",
  });
};
