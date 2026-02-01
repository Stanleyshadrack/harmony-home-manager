import { PropertyUnitApiResponse } from "../dto/PropertyUnitApiResponse";
import { apiRequest } from "../https";

export const API_PATHS = {
  // -------------------- Tenants --------------------
  TENANTS: "/api/tenants",

  TENANT_BY_ID: (id: number) => `/api/tenants/${id}`,

  APPROVE_TENANT: (id: number) =>
    `/api/tenants/${id}/approve`,

  ASSIGN_TENANT_UNIT: (tenantId: number, unitId: number) =>
    `/api/tenants/${tenantId}/assign-unit/${unitId}`,

  MOVE_OUT_TENANT: (id: number) =>
    `/api/tenants/${id}/move-out`,

  //----------------------- Approvals -------------------------
   APPROVALS:(userId: number) => "/api/user-approvals/{userId}/approve",


  // -------------------- Apartments -----------------
  APARTMENTS: "/v1/apartments",
  APARTMENT_BY_ID: (id: number) => `/v1/apartments/${id}`,

  // -------------------- Apartment Units ------------
 UNITS: "/api/units",

  UNIT_BY_ID: (id: string) =>
    `/v1/apartment-units/${id}`,

UNITS_BY_PROPERTY: (propertyId: number | string) =>
  `/api/units/property/${propertyId}`,

      /* =========================
     📄 Fetch ALL units ✅
  ========================= */
  fetchAll: () =>
    apiRequest<null, PropertyUnitApiResponse[]>({
      path: API_PATHS.UNITS,
      method: "GET",
    }),
  
  


  // -------------------- Properties -----------------
  PROPERTIES: "/api/properties",
  PROPERTY_BY_ID: (id: number) => `/api/properties/${id}`,
  PROPERTY_STATS: (id: number) => `/api/properties/${id}/stats`,


  // -----------------------------------------------------------

  // -------------------- Auth -----------------------
  AUTH_INVITE: "/api/auth/invite",
  AUTH_LOGIN: "/api/auth/login",
  AUTH_VERIFY_MFA: "/api/auth/verify-mfa",
  AUTH_RESEND_OTP: "/api/auth/resend-otp",
  AUTH_ONBOARDING: "/api/auth/onboarding",
  AUTH_INVITE_VALIDATE: "/api/auth/validate",
  AUTH_SET_PASSWORD:"/api/auth/set-password"

} as const;
