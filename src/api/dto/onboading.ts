export type RoleType = "TENANT" | "EMPLOYEE" | "ADMIN" | "LANDLORD";

type BasePayload = {
  type: RoleType;
  token: string; // ✅ required everywhere
  termsAccepted: boolean;
};

type BaseUser = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
};

export type CompleteOnboardingPayload =
  | (BasePayload & {
      type: "TENANT";

      user: BaseUser;

      tenant: {
        propertyId: number;
        unitId: number;
  
        emergencyContactName: string;
      emergencyContactPhone: string;
      relationship: string;
      };

      lease: {
        startDate: string;
        endDate: string;
        monthlyRent: number;
        securityDeposit: number;
        terms: string;
      };

      documents?: {
        leaseBase64?: string | null;
        idBase64?: string | null;
      };
      avatarBase64?: string | null;
    })

  | (BasePayload & {
      type: "EMPLOYEE";

      user: BaseUser;

      employee: {
        role: "MANAGER" | "CARETAKER" | "ACCOUNTANT";
        propertyId?: number;
      };
    })

  | (BasePayload & {
      type: "ADMIN";

      user: BaseUser & {
        email: string;
        password: string;
      };

      admin: {
        role: "SUPER_ADMIN" | "SUPPORT";
      };
    })

  | (BasePayload & {
      type: "LANDLORD";

      user: BaseUser & {
        email: string;
        password: string;
      };

      landlord: {
        company?: string;
        billingCycle?: "MONTHLY" | "ANNUAL";
        subscription: "BASIC" | "PREMIUM" | "ENTERPRISE";
      };
    });

export interface OnboardingResult {
  approved: boolean;
  passwordSet: boolean;

  role?: RoleType; // 🔥 strongly typed

  message?: string;

  // 🔥 future-ready additions
  token?: string;        // auto-login support
  redirectTo?: string;   // UI navigation hint
}