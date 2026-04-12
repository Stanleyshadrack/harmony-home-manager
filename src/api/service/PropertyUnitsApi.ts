import { apiRequest } from "../https";
import { API_PATHS } from "../constants/constants";
import { CreatePropertyUnitFormData, PropertyUnitApiResponse } from "../dto/CreatePropertyUnitFormData";
import { UpdatePropertyUnitFormData } from "../dto/UpdatePropertyUnitFormData";
import { fetchAllLandlords } from "./landlords.service.api";

export const PropertyUnitsApi = Object.freeze({
  /* =========================
     ➕ CREATE
  ========================= */
  create: (data: CreatePropertyUnitFormData) =>
    apiRequest<CreatePropertyUnitFormData, PropertyUnitApiResponse>({
      path: API_PATHS.UNITS,
      method: "POST",
      body: data,
    }),

  /* =========================
     📄 FETCH ALL (ADMIN)
  ========================= */
  fetchAll: () =>
    apiRequest<null, PropertyUnitApiResponse[]>({
      path: API_PATHS.UNITS,
      method: "GET",
    }),

  /* =========================
     🔍 FETCH BY ID
  ========================= */
  fetchById: (unitId: string) =>
    apiRequest<null, PropertyUnitApiResponse>({
      path: API_PATHS.UNIT_BY_ID(unitId),
      method: "GET",
    }),

  /* =========================
     🧍 TENANT
  ========================= */
  fetchTenantVacantUnits: () =>
    apiRequest<null, PropertyUnitApiResponse[]>({
      path: API_PATHS.TENANT_VACANT_UNITS,
      method: "GET",
    }),

  /* =========================
     👷 EMPLOYEE
  ========================= */
  fetchByEmployeeProperties: () =>
    apiRequest<null, PropertyUnitApiResponse[]>({
      path: API_PATHS.EMPLOYEE_UNITS,
      method: "GET",
    }),

  /* =========================
     🏠 LANDLORD
  ========================= */
  fetchLandlordUnits: () =>
    apiRequest<null, PropertyUnitApiResponse[]>({
      path: API_PATHS.LANDLORD_UNITS,
      method: "GET",
    }),

  /* =========================
     🏢 PROPERTY FILTER
  ========================= */
  fetchAvailableByProperty: (propertyId: number | string) =>
    apiRequest<null, PropertyUnitApiResponse[]>({
      path: `${API_PATHS.UNITS_BY_PROPERTY(propertyId)}?status=VACANT`,
      method: "GET",
    }),

  /* =========================
     ✏️ UPDATE
  ========================= */
  update: (unitId: string, data: UpdatePropertyUnitFormData) =>
    apiRequest<UpdatePropertyUnitFormData, PropertyUnitApiResponse>({
      path: API_PATHS.UNIT_BY_ID(unitId),
      method: "PUT",
      body: data,
    }),

  /* =========================
     🗑 DELETE
  ========================= */
  delete: (unitId: string) =>
    apiRequest<null, void>({
      path: API_PATHS.UNIT_BY_ID(unitId),
      method: "DELETE",
    }),
});