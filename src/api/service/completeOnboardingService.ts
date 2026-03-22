import { apiRequest } from "../https";
import { API_PATHS } from "../constants/constants";
import { CompleteOnboardingPayload, OnboardingResult } from "@/api/dto/onboading";



export async function completeOnboardingService(
  payload: CompleteOnboardingPayload
): Promise<OnboardingResult> {
  try {
    const response = await apiRequest<
      CompleteOnboardingPayload,
      OnboardingResult
    >({
      path: API_PATHS.AUTH_ONBOARDING,
      method: "POST",
      body: payload,
    });

    return response;
  } catch (error: any) {
    // Normalize backend errors
    throw new Error(
      error?.message || "Failed to complete onboarding. Please try again."
    );
  }
}