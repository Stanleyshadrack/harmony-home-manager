export type CompleteOnboardingPayload = {
  token: string;

  tenant: {
    firstName: string;
    lastName: string;
    phone: string;
    propertyId?: number;
    unitId?: number;
    emergencyContact: string;
  };

  lease: {
    startDate: string;
    endDate: string;
    monthlyRent: number;
    securityDeposit: number;
    terms: string;
  };

  // 🔥 Base64 files
  leaseBase64?: string | null;
  idBase64?: string | null;

  termsAccepted: boolean;
};

export interface OnboardingResult {
  approved: boolean;
  passwordSet: boolean;
  role?: string;
  message?: string;
}