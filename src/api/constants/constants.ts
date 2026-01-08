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

  // -------------------- Apartment Units ------------
  UNITS: "/v1/apartment-units",
  UNIT_BY_ID: (id: number) => `/v1/apartment-units/${id}`,

  // -------------------- Auth -----------------------
  AUTH_INVITE: "/api/auth/invite",
};
