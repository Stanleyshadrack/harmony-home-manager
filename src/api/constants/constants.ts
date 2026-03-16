
import { PropertyUnitApiResponse } from "../dto/CreatePropertyUnitFormData";
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



  // ---------- Landlords ----------
  LANDLORDS: "/api/landlords",

  LANDLORD_BY_ID: (id: number) =>
    `/api/landlords/${id}`,

  MY_LANDLORD_PROFILE: "/api/landlords/me",

  APPROVE_LANDLORD: (landlordId: number) =>
    `/api/landlords/${landlordId}/approve`,

  REJECT_LANDLORD: (landlordId: number) =>
    `/api/landlords/${landlordId}/reject`,

  // ---------- Landlord Employees ----------

  LANDLORD_EMPLOYEES: "/api/landlords/employees",

  APPROVE_LANDLORD_EMPLOYEE: (employeeId: number) =>
    `/api/landlords/employees/${employeeId}/approve`,

  REJECT_LANDLORD_EMPLOYEE: (employeeId: number) =>
    `/api/landlords/employees/${employeeId}/reject`,

  ASSIGN_EMPLOYEE_TO_PROPERTY: (employeeId: number, propertyId: number) =>
    `/api/landlords/employees/${employeeId}/assign-property/${propertyId}`,


// ----------------------- Approvals -------------------------
APPROVALS: "/api/approvals",

APPROVAL_BY_ID: (id: number) =>
  `/api/approvals/${id}`,

APPROVE_APPROVAL: (id: number) =>
  `/api/approvals/${id}/approve`,

REJECT_APPROVAL: (id: number) =>
  `/api/approvals/${id}/reject`,

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

PROPERTY_UNITS: (id: number) => `/api/properties/${id}/units`,

CREATE_PROPERTY: "/api/properties",

UPDATE_PROPERTY: (id: number) => `/api/properties/${id}`,

DELETE_PROPERTY: (id: number) => `/api/properties/${id}`,

ASSIGN_PROPERTY: "/api/properties/assign",

UNASSIGN_PROPERTY: (id: number) => `/api/properties/${id}/unassign`,


  // -----------------------------------------------------------

// -------------------- Auth -----------------------
AUTH_INVITE: "/api/auth/invite",
AUTH_LOGIN: "/api/auth/login",
AUTH_VERIFY_MFA: "/api/auth/verify-mfa",
AUTH_RESEND_OTP: "/api/auth/resend-otp",
AUTH_ONBOARDING: "/api/auth/onboarding",
AUTH_INVITE_VALIDATE: "/api/auth/validate",
AUTH_SET_PASSWORD: "/api/auth/set-password",
AUTH_VALIDATE_SET_PASSWORD: "/api/auth/validate-set-password",


// -------------------- Subscriptions --------------------
SUBSCRIPTIONS: "/api/subscriptions",

// 🔐 Landlord (self)
MY_SUBSCRIPTION: "/api/subscriptions/me",

UPGRADE_MY_SUBSCRIPTION: "/api/subscriptions/me/upgrade",

RENEW_MY_SUBSCRIPTION: "/api/subscriptions/me/renew",

// 🛠 Admin
SUBSCRIPTION_BY_LANDLORD: (landlordId: number) =>
  `/api/subscriptions/${landlordId}`,

SUSPEND_SUBSCRIPTION: (landlordId: number) =>
  `/api/subscriptions/${landlordId}/suspend`,

RENEW_SUBSCRIPTION: (landlordId: number) =>
  `/api/subscriptions/${landlordId}/renew`,

//.......................Meters.....................

METERS: "/api/water-meters",

METER_BY_ID: (id: number) =>
  `/api/water-meters/${id}`,

CREATE_METER: "/api/water-meters",

UPDATE_METER: (id: number) =>
  `/api/water-meters/${id}`,

DELETE_METER: (id: number) =>
  `/api/water-meters/${id}`,

METERS_BY_PROPERTY: (propertyId: number | string) =>
  `/api/water-meters/property/${propertyId}`,

METERS_BY_UNIT: (unitId: number | string) =>
  `/api/water-meters/unit/${unitId}`,

METERS_STATS: "/api/water-meters/stats",

// ===============================
// Water Readings
// ===============================

WATER_READINGS: "/api/water-readings",

CREATE_WATER_READING: "/api/water-readings",

WATER_READING_BY_ID: (id: number) =>
  `/api/water-readings/${id}`,

DELETE_WATER_READING: (id: number) =>
  `/api/water-readings/${id}`,

APPROVE_WATER_READING: (id: number) =>
  `/api/water-readings/${id}/approve`,

REJECT_WATER_READING: (id: number) =>
  `/api/water-readings/${id}/reject`,

WATER_READINGS_BY_UNIT: (unitId: number | string) =>
  `/api/water-readings/unit/${unitId}`,

LAST_READING_BY_UNIT: (unitId: number | string) =>
  `/api/water-readings/unit/${unitId}/last`,

WATER_READINGS_BY_PROPERTY: (propertyName: string) =>
  `/api/water-readings/property/${propertyName}`,

WATER_HIGH_USAGE: "/api/water-readings/high-usage",

WATER_STATS: "/api/water-readings/stats",

WATER_MONTHLY_STATS: "/api/water-readings/monthly",

// -------------------- Employees -----------------
EMPLOYEES: "/api/employees",
EMPLOYEE_BY_ID: (id: number) => `/api/employees/${id}`,

} as const;
