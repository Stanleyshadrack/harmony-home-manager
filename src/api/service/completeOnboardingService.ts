import { apiRequest } from "../https";
import { API_PATHS } from "../constants/constants";

export interface CompleteOnboardingPayload {
  token: string;
  user: { firstName: string; lastName: string; phone: string };
  tenant?: {
    propertyId: number;
    unitId: number;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    relationship?: string;
    idNumber?: string;
  } | null;
  lease?: {
    startDate: string;
    endDate: string;
    monthlyRent?: number | null;
    securityDeposit?: number | null;
    terms?: string;
  } | null;
  documents?: { idBase64?: string; leaseBase64?: string } | null;
  employee?: { propertyIds: number[] } | null;
  landlord?: { companyName?: string } | null;
  companyId?: number | null;
  apartmentIds?: number[] | null;
  termsAccepted: boolean;
}

export interface CompleteOnboardingResponse {
  status: number;
  message: string;
  timestamp: string;
}

export const completeOnboardingService = (payload: CompleteOnboardingPayload) =>
  apiRequest<CompleteOnboardingPayload, CompleteOnboardingResponse>({
    path: API_PATHS.AUTH_ONBOARDING,
    method: "POST",
    body: payload,
  });
