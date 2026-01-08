
import { API_PATHS } from "./constants/constants";
import { apiRequest } from "./https";

export type InviteUserPayload = {
  email: string;
  role: "LANDLORD" | "TENANT" | "ADMIN";
};

export const inviteUserService = async (
  payload: InviteUserPayload
) => {
  return apiRequest<InviteUserPayload, {
    status: number;
    message: string;
    timestamp: string;
  }>({
    url: API_PATHS.AUTH_INVITE,
    method: "POST",
    data: payload,
  });
};
