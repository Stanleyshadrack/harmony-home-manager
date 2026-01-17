import { apiRequest } from "../https";
import { API_PATHS } from "../constants/constants";
import { PropertyUnitApiResponse } from "../dto/PropertyUnitApiResponse";
import { CreatePropertyUnitFormData } from "../dto/CreatePropertyUnitFormData";
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
