import { apiRequest } from "../https";
import { API_PATHS } from "../constants/constants";
import { CreatePropertyUnitFormData, PropertyUnitApiResponse } from "../dto/CreatePropertyUnitFormData";
import { UpdatePropertyUnitFormData } from "../dto/UpdatePropertyUnitFormData";

export const PropertyUnitsApi = Object.freeze({
  create: (data: CreatePropertyUnitFormData) =>
    apiRequest<CreatePropertyUnitFormData, PropertyUnitApiResponse>({
      path: API_PATHS.UNITS,
      method: "POST",
      body: data,
    }),

  fetchAll: () =>
    apiRequest<null, PropertyUnitApiResponse[]>({
      path: API_PATHS.UNITS,
      method: "GET",
    }),

  fetchById: (unitId: string) =>
    apiRequest<null, PropertyUnitApiResponse>({
      path: API_PATHS.UNIT_BY_ID(unitId),
      method: "GET",
    }),

      /** ✅ TENANT-SAFE: Fetch vacant units for a property */
  fetchAvailableByProperty: (propertyId: number | string) =>
    apiRequest<null, PropertyUnitApiResponse[]>({
      path: `${API_PATHS.UNITS_BY_PROPERTY(propertyId)}?status=VACANT`,
      method: "GET",
    }),

  update: (unitId: string, data: UpdatePropertyUnitFormData) =>
    apiRequest<UpdatePropertyUnitFormData, PropertyUnitApiResponse>({
      path: API_PATHS.UNIT_BY_ID(unitId),
      method: "PUT",
      body: data,
    }),

  delete: (unitId: string) =>
    apiRequest<null, void>({
      path: API_PATHS.UNIT_BY_ID(unitId),
      method: "DELETE",
    }),
});
