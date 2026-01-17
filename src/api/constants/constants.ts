import { PropertyUnitApiResponse } from "../dto/PropertyUnitApiResponse";
import { apiRequest } from "../https";

export const API_PATHS = {
  // -------------------- Tenants --------------------
  TENANTS: "/v1/tenants",
  TENANT_BY_ID: (id: number) => `/v1/tenants/${id}`,

  // -------------------- Apartments -----------------
  APARTMENTS: "/v1/apartments",
  APARTMENT_BY_ID: (id: number) => `/v1/apartments/${id}`,

  // -------------------- Apartment Units ------------
 UNITS: "/api/units",

  UNIT_BY_ID: (id: string) =>
    `/v1/apartment-units/${id}`,

  UNITS_BY_PROPERTY: (propertyId: string) =>
    `/v1/apartment-units/property/${propertyId}`,

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

} as const;
