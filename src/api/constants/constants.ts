/**
 * ======================================================
 * API base paths (NO base URL here)
 * ======================================================
 */
export const API_PATHS = {
  // -------------------- Tenants --------------------
  TENANTS: "/v1/tenants",
  TENANT_BY_ID: (id: number) => `/v1/tenants/${id}`,

  // -------------------- Apartments -----------------
  APARTMENTS: "/v1/apartments",
  APARTMENT_BY_ID: (id: number) => `/v1/apartments/${id}`,
  ADD_APARTMENT_URL:"",

  // -------------------- Apartment Units ------------
  UNITS: "/v1/apartment-units",
  UNIT_BY_ID: (id: number) => `/v1/apartment-units/${id}`,

  // -------------------- Auth -----------------------
  AUTH_INVITE: "/api/auth/invite",
   AUTH_LOGIN: "/api/auth/login",
  AUTH_VERIFY_MFA: "/api/auth/verify-mfa",
  AUTH_RESEND_OTP:"/api/auth/resend-otp"
};
