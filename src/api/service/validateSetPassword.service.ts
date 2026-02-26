import { apiRequest } from "../https";
import { API_PATHS } from "../constants/constants";

export type ValidateSetPasswordResponse = {
  email: string;
  role: string;
};

export const validateSetPasswordToken = async (token: string) => {
  return apiRequest<
    void,
    ValidateSetPasswordResponse
  >({
    path: `${API_PATHS.AUTH_VALIDATE_SET_PASSWORD}?token=${token}`,
    method: "GET",
  });
};