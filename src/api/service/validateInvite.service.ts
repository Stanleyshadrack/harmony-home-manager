import { apiRequest } from "../https";
import { API_PATHS } from "../constants/constants";

export type UserRole =
  | "LANDLORD"
  | "TENANT"
  | "EMPLOYEE"
  | "SUPER_ADMIN";

export type InviteValidationResponse = {
  email: string;
  role: UserRole;
  invitedBy?: string;
  expiresAt: string;

  /* 🔥 Prefill */
  firstName?: string;
  lastName?: string;
  phone?: string;

  rentAmount: number;   
  depositAmount: number;

  /* 🔥 Tenant context */
  unit?: {
    id: number;
    unitNumber: string;
    propertyName: string;
  };

  property?: {
    id: number;
    name: string;
  };
};

export async function validateInvite(
  token: string
): Promise<InviteValidationResponse> {
  if (!token) {
    throw new Error("Invalid invitation link.");
  }

  try {
    const response = await apiRequest<null, InviteValidationResponse>({
      path: `${API_PATHS.AUTH_INVITE_VALIDATE}?token=${encodeURIComponent(
        token
      )}`,
      method: "GET",
    });

    /* 🔥 Defensive normalization (VERY IMPORTANT) */
    return {
      ...response,
      unit: response.unit ?? undefined,
      property: response.property ?? undefined,
      firstName: response.firstName ?? "",
      lastName: response.lastName ?? "",
      phone: response.phone ?? "",
    };
  } catch (error: any) {
    throw new Error(
      error?.message || "Failed to validate invitation. Please try again."
    );
  }
}