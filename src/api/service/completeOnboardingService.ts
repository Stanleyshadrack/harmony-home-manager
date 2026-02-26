import { apiRequest } from "../https";
import { API_PATHS } from "../constants/constants";

export type CompleteOnboardingPayload = {
  token: string;
  firstName: string;
  lastName: string;
  phone: string;
  idNumber: string;
};

export type CompleteOnboardingResponse = {
  approved: boolean;
  passwordSet: boolean;
};

export const completeOnboardingService = async (
  payload: CompleteOnboardingPayload
) => {
  return apiRequest<
    CompleteOnboardingPayload,
    CompleteOnboardingResponse
  >({
    path: API_PATHS.AUTH_ONBOARDING, // "/api/auth/onboarding"
    method: "POST",
    body: payload,
  });
};